import os

import httpx
from dotenv import load_dotenv


def main() -> None:
    load_dotenv()
    key = os.getenv("GROQ_API_KEY")

    if not key:
        raise SystemExit("GROQ_API_KEY is missing. Add it to Backend/.env before running this script.")

    print(f"Key length: {len(key)}")
    print(f"Key starts with: {key[:10]}")

    models = [
        os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
    ]

    for model in dict.fromkeys(models):
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
                timeout=10.0,
            )
            if resp.status_code == 200:
                print(f"OK {model}: WORKS")
                break

            error_msg = resp.json().get("error", {}).get("message", "")[:80]
            print(f"FAIL {model}: {error_msg}")
        except Exception as exc:
            print(f"FAIL {model}: {str(exc)[:80]}")


if __name__ == "__main__":
    main()
