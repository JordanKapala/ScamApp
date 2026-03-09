import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('userInfo')

def handler(event, context):
    body = json.loads(event['body'])
    email = body.get('email')
    password = body.get('password')

    # Check if user already exists
    response = table.get_item(Key={'email': email})
    if response.get('Item'):
        return respond(409, {'success': False, 'message': 'Email already registered'})

    table.put_item(Item={'email': email, 'password': password})
    return respond(200, {'success': True})

def respond(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(body)
    }