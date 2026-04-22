import json
import os

import httpx
from dotenv import load_dotenv

SYSTEM_PROMPT = """You are an expert social media content creator.

IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no backticks.

JSON structure:
{
  "content": {
    "LinkedIn": "Professional post here"
  },
  "hashtags": ["tag1", "tag2"],
  "image_prompt": "A vibrant visual description"
}
"""


def main() -> None:
    load_dotenv()
    key = os.getenv("GROQ_API_KEY")

    if not key:
        raise SystemExit("GROQ_API_KEY is missing. Add it to Backend/.env before running this script.")

    user_message = "Create LinkedIn post for: Python Programming for beginners"

    print("Testing Groq API...")
    print(f"Key: {key[:15]}...")

    try:
        resp = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json={
                "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                "temperature": 0.7,
                "max_tokens": 1000,
                "response_format": {"type": "json_object"},
            },
            timeout=30.0,
        )

        print(f"\nStatus: {resp.status_code}")
        data = resp.json()

        if resp.status_code == 200:
            content = data["choices"][0]["message"]["content"]
            print(f"Content:\n{content}")
            try:
                parsed = json.loads(content.strip())
                print("\nValid JSON received!")
                print(f"LinkedIn post: {parsed['content']['LinkedIn']}")
            except (json.JSONDecodeError, KeyError) as exc:
                print(f"\nJSON validation failed: {exc}")
        else:
            print(f"Error: {data}")
    except Exception as exc:
        print(f"Exception: {exc}")


if __name__ == "__main__":
    main()
