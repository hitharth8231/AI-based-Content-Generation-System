import httpx
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('GROQ_API_KEY')
print(f"Key length: {len(key) if key else 0}")
print(f"Key starts with: {key[:10] if key else 'None'}")

models = ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma-7b-it"]

for model in models:
    try:
        resp = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 50,
            },
            timeout=10.0
        )
        if resp.status_code == 200:
            print(f"✓ {model}: WORKS")
            break
        else:
            error_msg = resp.json().get('error', {}).get('message', '')[:60]
            print(f"✗ {model}: {error_msg}")
    except Exception as e:
        print(f"✗ {model}: {str(e)[:60]}")
