import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('userInfo')

def handler(event, context):
    body = json.loads(event['body'])
    email = body.get('email')
    password = body.get('password')

    response = table.get_item(Key={'email': email})
    item = response.get('Item')

    if not item:
        return respond(401, {'success': False, 'message': 'Email not found'})
    if item['password'] != password:
        return respond(401, {'success': False, 'message': 'Incorrect password'})

    return respond(200, {'success': True})

def respond(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(body)
    }