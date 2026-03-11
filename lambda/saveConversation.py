import json
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('conversations')

def lambda_handler(event, context):
    body = json.loads(event['body'])
    userEmail = body.get('userEmail')
    history = body.get('history', [])
    duration = body.get('duration', 0)

    if not userEmail or not history:
        return respond(400, {'success': False, 'message': 'Missing required fields'})

    timestamp = datetime.utcnow().isoformat()

    table.put_item(Item={
        'userEmail': userEmail,
        'timestamp': timestamp,
        'history': json.dumps(history),
        'duration': str(duration),
        'date': datetime.utcnow().strftime('%B %d, %Y %I:%M %p')
    })

    return respond(200, {'success': True})

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