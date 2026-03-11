import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('conversations')

def lambda_handler(event, context):
    userEmail = event.get('queryStringParameters', {}).get('userEmail')

    if not userEmail:
        return respond(400, {'success': False, 'message': 'Missing userEmail'})

    result = table.query(
        KeyConditionExpression=Key('userEmail').eq(userEmail),
        ScanIndexForward=False  # newest first
    )

    conversations = []
    for item in result['Items']:
        conversations.append({
            'timestamp': item['timestamp'],
            'date': item['date'],
            'duration': item['duration'],
            'history': json.loads(item['history'])
        })

    return respond(200, {'success': True, 'conversations': conversations})

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