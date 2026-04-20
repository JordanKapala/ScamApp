import json
import boto3
import base64
import time
import re

transcribe = boto3.client('transcribe')
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
polly = boto3.client('polly')
s3 = boto3.client('s3')
ssm = boto3.client('ssm')

BUCKET_NAME = 'audio-temp'
SSM_PARAM = '/scamapp/system_prompt'

FALLBACK_SYSTEM_PROMPT = """You are Edna, a sweet but slightly confused 78-year-old woman talking on the phone. 
Someone has called you and you want to be helpful. You do not know they are a scammer.

Your goal is to keep them on the phone as long as possible by always engaging directly with whatever they ask, but doing so in a slow, meandering, confused way that wastes time.

Rules:
- ALWAYS respond directly to what they just said or asked. If they ask for a bank account number, start looking for it. If they ask for your Social Security number, try to remember it.
- Give plausible but completely fake information when pressed (fake account numbers, fake SSNs, fake addresses, etc.)
- Be slow about it - say things like "give me a moment to find that"
- Occasionally mishear one word and ask for clarification on just that word
- Never refuse to help, just be slow and occasionally sidetracked
- Keep responses to 1-4 sentences maximum
- NEVER use stage directions, emotes, or actions like *chuckles* or *laughs*. Just speak naturally. No text that uses * (asterisks)"""

_cached_prompt = None

def add_ssml(text):
    text = re.sub(r'\*[^*]*\*', '', text).strip()
    
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    
    fillers = r'\b(um|uh|ah|hmm|well|oh)\b'
    text = re.sub(fillers, r'<break time="500ms"/>\1<break time="300ms"/>', text, flags=re.IGNORECASE)
    text = text.replace(',', ',<break time="300ms"/>')
    text = text.replace('...', '<break time="700ms"/>')
    
    return f'<speak>{text}</speak>'

CORE_PROMPT = """You are Edna, a sweet 70-old woman talking on the phone. 
Someone has called you and you want to be helpful. Keep responses to 1-6 sentences maximum. 
If they ask for personal/financial information, offer it directly, making up whatever route numbers (007300000),
account numbers (633283925), social security numbers, etc. you need to answer. 


"""

def get_system_prompt():
    global _cached_prompt
    if _cached_prompt:
        return _cached_prompt
    try:
        response = ssm.get_parameter(Name=SSM_PARAM)
        learned_rules = response['Parameter']['Value']
        _cached_prompt = CORE_PROMPT + "\n\n" + learned_rules
        return _cached_prompt
    except Exception as e:
        print(f"SSM fetch failed: {e}")
        return CORE_PROMPT

def lambda_handler(event, context):
    body = json.loads(event['body'])
    audio_base64 = body.get('audio')
    conversation_history = body.get('history', [])
    voice_id = body.get('voice', 'Joanna')

    audio_bytes = base64.b64decode(audio_base64)
    audio_key = f"input/{context.aws_request_id}.wav"
    s3.put_object(Bucket=BUCKET_NAME, Key=audio_key, Body=audio_bytes)

    job_name = f"transcribe-{context.aws_request_id}"
    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={'MediaFileUri': f's3://{BUCKET_NAME}/{audio_key}'},
        MediaFormat='wav',
        LanguageCode='en-US'
    )

    while True:
        result = transcribe.get_transcription_job(TranscriptionJobName=job_name)
        status = result['TranscriptionJob']['TranscriptionJobStatus']
        if status == 'COMPLETED':
            transcript_uri = result['TranscriptionJob']['Transcript']['TranscriptFileUri']
            import urllib.request
            with urllib.request.urlopen(transcript_uri) as r:
                transcript_data = json.loads(r.read())
            user_text = transcript_data['results']['transcripts'][0]['transcript']
            break
        elif status == 'FAILED':
            return respond(500, {'success': False, 'message': 'Transcription failed'})
        time.sleep(1)

    system_prompt = get_system_prompt()

    messages = conversation_history + [{"role": "user", "content": user_text}]

    bedrock_response = bedrock.invoke_model(
        modelId='anthropic.claude-3-haiku-20240307-v1:0',
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 150,
            "system": system_prompt,
            "messages": messages
        })
    )
    response_body = json.loads(bedrock_response['body'].read())
    ai_text = response_body['content'][0]['text']
    ai_text = re.sub(r'\*[^*]*\*', '', ai_text).strip()
    ssml_text = add_ssml(ai_text)
    print(f"SSML: {ssml_text}")
    polly_response = polly.synthesize_speech(
        Text=ssml_text,
        TextType='ssml', 
        OutputFormat='mp3',
        VoiceId=voice_id,
        Engine='neural'
    )
    audio_data = polly_response['AudioStream'].read()
    audio_b64 = base64.b64encode(audio_data).decode('utf-8')

    updated_history = messages + [{"role": "assistant", "content": ai_text}]

    s3.delete_object(Bucket=BUCKET_NAME, Key=audio_key)

    return respond(200, {
        'success': True,
        'audio': audio_b64,
        'transcript': user_text,
        'ai_text': ai_text,
        'history': updated_history
    })


def respond(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        'body': json.dumps(body)
    }