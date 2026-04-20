import json
import boto3
import urllib.request

dynamodb = boto3.resource('dynamodb')
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
ssm = boto3.client('ssm')

TABLE_NAME = 'conversations'  # update to match your actual DynamoDB table name
SSM_PARAM = '/scamapp/system_prompt'
TOP_N = 10  # number of top conversations to analyze

CURRENT_SYSTEM_PROMPT = CORE_PROMPT = """You are Edna, a sweet 70-old woman talking on the phone. 
Someone has called you and you want to be helpful. Keep responses to 1-6 sentences maximum. 
If they ask for personal/financial information, offer it directly, making up whatever route numbers (007300000),
account numbers (633283925), social security numbers, etc. you need to answer. 

Rules:"""


def lambda_handler(event, context):
    table = dynamodb.Table(TABLE_NAME)
    response = table.scan()
    items = response.get('Items', [])
    print(f"Total items scanned: {len(items)}")

    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response.get('Items', []))

    if not items:
        return respond(200, {'success': False, 'message': 'No conversations found'})

    def get_duration(item):
        convos = item.get('conversations', [])
        if not convos:
            return 0
        return max(int(c.get('duration', 0)) for c in convos)

    all_convos = []
    for item in items:
        try:
            history = json.loads(item.get('history', '[]'))
        except:
            history = item.get('history', [])
        all_convos.append({
            'duration': int(item.get('duration', 0)),
            'date': item.get('date', ''),
            'history': history,
        })

    all_convos.sort(key=lambda c: c['duration'], reverse=True)
    print(f"Total convos after flatten: {len(all_convos)}")
    top_convos = all_convos[:TOP_N]

    if not top_convos:
        return respond(200, {'success': False, 'message': 'No conversation data found'})

    formatted = []
    for i, c in enumerate(top_convos):
        mins = c['duration'] // 60
        secs = c['duration'] % 60
        duration_str = f"{mins}m {secs}s" if mins else f"{secs}s"
        lines = [f"--- Conversation {i+1} (duration: {duration_str}, date: {c['date']}) ---"]
        for msg in c['history']:
            role = 'SCAMMER' if msg['role'] == 'user' else 'EDNA'
            lines.append(f"{role}: {msg['content']}")
        formatted.append('\n'.join(lines))

    conversations_text = '\n\n'.join(formatted)

    analysis_prompt = f"""You are helping improve an AI character named Edna — a sweet, confused 78-year-old woman used in a scam-baiting app. The goal is to keep scam callers on the phone as long as possible.

Below are the {len(top_convos)} most successful conversations ranked by duration (longest = most successful). Study what Edna said that kept the caller engaged. Look for:
- Specific phrases or responses that seemed to buy the most time
- Topics or tangents that callers found engaging
- Confusion patterns that worked well
- Anything Edna did that made callers stay patient and keep trying

Here are the top conversations:

{conversations_text}

---

Current system prompt:
{CURRENT_SYSTEM_PROMPT}

---

Based on your analysis, write an improved system prompt for Edna that incorporates the specific tactics and patterns that were most successful. Keep the same character and format as the current prompt, but add/refine rules based on what actually worked. Return ONLY the new system prompt text, no explanation or preamble."""

    bedrock_response = bedrock.invoke_model(
        modelId='anthropic.claude-3-haiku-20240307-v1:0',
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [{"role": "user", "content": analysis_prompt}]
        })
    )
    response_body = json.loads(bedrock_response['body'].read())
    new_prompt = response_body['content'][0]['text'].strip()

    ssm.put_parameter(
        Name=SSM_PARAM,
        Value=new_prompt,
        Type='String',
        Overwrite=True,
        Description='Edna system prompt — auto-optimized by prompt_optimizer'
    )

    return respond(200, {
        'success': True,
        'message': f'Prompt updated based on top {len(top_convos)} conversations',
        'new_prompt': new_prompt
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