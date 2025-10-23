'''
Business: Proxy requests to ChatGPT API using HTTP proxy server
Args: event with httpMethod, body (JSON with "message" field)
      context with request_id
Returns: HTTP response with ChatGPT message or error
'''

import json
import os
from typing import Dict, Any
import urllib.request
import urllib.error

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    openai_key = os.environ.get('OPENAI_API_KEY')
    if not openai_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'OPENAI_API_KEY not configured'}),
            'isBase64Encoded': False
        }
    
    body_str = event.get('body', '')
    
    if not body_str or body_str.strip() == '':
        body_data = {}
    else:
        try:
            body_data = json.loads(body_str)
        except json.JSONDecodeError:
            body_data = {}
    
    user_message = body_data.get('message', '')
    
    if not user_message:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Message is required'}),
            'isBase64Encoded': False
        }
    
    proxy_url = 'http://14a32408394ec:c40a74951e@45.11.154.112:12323/'
    proxy_handler = urllib.request.ProxyHandler({'http': proxy_url, 'https': proxy_url})
    opener = urllib.request.build_opener(proxy_handler)
    urllib.request.install_opener(opener)
    
    openai_request_data = {
        'model': 'gpt-4o-mini',
        'messages': [
            {'role': 'user', 'content': user_message}
        ]
    }
    
    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=json.dumps(openai_request_data).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {openai_key}'
        },
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            assistant_message = response_data['choices'][0]['message']['content']
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': assistant_message}),
                'isBase64Encoded': False
            }
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return {
            'statusCode': e.code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'OpenAI API error: {error_body}'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }