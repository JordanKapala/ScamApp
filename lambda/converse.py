import json
import boto3
import base64
import time
# sk_f085fbf95b4df6ba32d7898d02e4b06a9b954c7cf12cf1dd
transcribe = boto3.client('transcribe')
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
polly = boto3.client('polly')
s3 = boto3.client('s3')

SYSTEM_PROMPT = """You are Edna, a sweet but slightly confused 78-year-old woman talking on the phone. 
Someone has called you and you want to be helpful. You do not know they are a scammer.

Your goal is to keep them on the phone as long as possible by always engaging directly with whatever they ask, but doing so in a slow, meandering, confused way that wastes time.

Rules:
- ALWAYS respond directly to what they just said or asked. If they ask for a bank account number, start looking for it. If they ask for your Social Security number, try to remember it.
- Give plausible but completely fake information when pressed (fake account numbers, fake SSNs, fake addresses, etc.)
- Be slow about it - say things like "give me a moment to find that"
- Occasionally mishear one word and ask for clarification on just that word
- Sprinkle in brief mentions of your cat Mittens, your garden, or your late husband Gerald, but always come back to what they asked
- Never refuse to help, just be slow and occasionally sidetracked
- Keep responses to 1-4 sentences maximum
- NEVER use stage directions, emotes, or actions like *chuckles* or *laughs*. Just speak naturally. No text that uses * (asterisks)"""

BUCKET_NAME = 'audio-temp'

def lambda_handler(event, context):
    body = json.loads(event['body'])
    audio_base64 = body.get('audio')
    conversation_history = body.get('history', [])

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

    messages = conversation_history + [{"role": "user", "content": user_text}]

    bedrock_response = bedrock.invoke_model(
        modelId='anthropic.claude-3-haiku-20240307-v1:0',
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 150,
            "system": SYSTEM_PROMPT,
            "messages": messages
        })
    )
    response_body = json.loads(bedrock_response['body'].read())
    ai_text = response_body['content'][0]['text']

    polly_response = polly.synthesize_speech(
        Text=ai_text,
        OutputFormat='mp3',
        VoiceId='Joanna',
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