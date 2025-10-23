import json
import os
import urllib.request
import urllib.error
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Отправка запросов в ChatGPT API через прокси
    Args: event с httpMethod, body (JSON с message)
    Returns: Ответ от ChatGPT или ошибка
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'OPENAI_API_KEY not configured'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    user_message = body_data.get('message', '')
    
    if not user_message:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Message is required'})
        }
    
    proxy_url = 'http://14a32408394ec:c40a74951e@45.11.154.112:12323/'
    proxy_handler = urllib.request.ProxyHandler({
        'http': proxy_url,
        'https': proxy_url
    })
    opener = urllib.request.build_opener(proxy_handler)
    
    openai_payload = {
        'model': 'gpt-3.5-turbo',
        'messages': [
            {'role': 'user', 'content': user_message}
        ],
        'temperature': 0.7
    }
    
    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=json.dumps(openai_payload).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        },
        method='POST'
    )
    
    response_data = opener.open(req, timeout=30)
    response_json = json.loads(response_data.read().decode('utf-8'))
    
    assistant_message = response_json['choices'][0]['message']['content']
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'message': assistant_message,
            'model': response_json['model']
        })
    }
