import os
import json
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from spellchecker import SpellChecker
import re
import base64
from huggingface_hub import InferenceClient
from PIL import Image
import io

# ─── Safe JSON Parser ─────────────────────────────────────
def safe_parse_json(text):
    try:
        text = re.sub(r"```json|```", "", text).strip()

        start = text.find("{")
        end = text.rfind("}") + 1

        if start != -1 and end != -1:
            json_str = text[start:end]
            return json.loads(json_str)

    except Exception as e:
        print("❌ JSON Parse failed:", e)

    return None


load_dotenv()

app = FastAPI(title="PostCraft AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Spelling Checker ─────────────────────────────────────
spell = SpellChecker()

def check_and_correct_topic(topic: str) -> dict:
    words = topic.lower().split()
    misspelled = spell.unknown(words)

    if not misspelled:
        return {"original": topic, "corrected": topic, "is_correct": True, "suggestions": {}}

    corrected_words = []
    suggestions = {}

    for word in words:
        if word in misspelled:
            likely = spell.correction(word)
            suggestions[word] = list(spell.candidates(word))[:3] if spell.candidates(word) else [likely]
            corrected_words.append(likely if likely else word)
        else:
            corrected_words.append(word)

    corrected = " ".join(corrected_words)

    return {
        "original": topic,
        "corrected": corrected,
        "is_correct": False,
        "suggestions": suggestions,
        "misspelled_words": list(misspelled)
    }

# ─── Models ───────────────────────────────────────────────
class GenerateRequest(BaseModel):
    topic: str
    audience: str = "General Public"
    platforms: List[str] = ["LinkedIn", "Instagram"]
    languages: List[str] = ["English"]

class GenerateResponse(BaseModel):
    content: dict
    translations: dict
    hashtags: List[str]
    image_prompt: str
    image_url: str | None = None
    spelling: dict = {}

# ─── SYSTEM PROMPT ────────────────────────────────
SYSTEM_PROMPT = """
You are a JSON generator.

STRICT RULES:
- Return ONLY valid JSON
- No explanation
- No markdown
- Close all quotes properly

Format:
{
  "content": {
    "LinkedIn": "...",
    "Instagram": "...",
    "Twitter": "...",
    "Facebook": "..."
  },
  "translations": {
    "Hindi": "...",
    "Hinglish": "...",
    "Bengali": "...",
    "Tamil": "..."
  },
  "hashtags": ["tag1","tag2","tag3","tag4","tag5"],
  "image_prompt": "..."
}
"""

# ─── GROQ CALL ────────────────────────────────────────────
def generate_content(topic, audience, platforms, languages):
    groq_key = os.getenv("GROQ_API_KEY")

    user_message = f"""
Topic: {topic}
Audience: {audience}
Platforms: {", ".join(platforms)}
Languages: {", ".join([l for l in languages if l != "English"])}
Return only JSON.
"""

    resp = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {groq_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.7,
        },
        timeout=60.0
    )

    raw = resp.json()["choices"][0]["message"]["content"]
    print("[RAW OUTPUT]", raw[:300])

    parsed = safe_parse_json(raw)

    if not parsed:
        print("⚠️ Fallback triggered")
        return {
            "content": {
                "LinkedIn": raw[:300]
            },
            "translations": {},
            "hashtags": [],
            "image_prompt": ""
        }

    return parsed

# ─── IMAGE (HUGGINGFACE SAFE) ─────────────────────────
def generate_image_huggingface(prompt):
    try:
        hf_token = os.getenv("HF_TOKEN")

        if not hf_token:
            print("⚠️ HF_TOKEN missing")
            return None

        client = InferenceClient(api_key=hf_token)

        print(f"🎨 Generating image with HuggingFace for prompt: {prompt[:50]}...")

        image = client.text_to_image(
            prompt,
            model="runwayml/stable-diffusion-v1-5",
        )

        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        img_bytes = buffer.getvalue()

        b64_encoded = base64.b64encode(img_bytes).decode("utf-8")
        return f"data:image/png;base64,{b64_encoded}"

    except Exception as e:
        print("❌ HF failed:", e)
        return None  # 👈 CRASH PREVENTION

# ─── ROUTES ───────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "running"}

@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic empty")

    spelling = check_and_correct_topic(req.topic)
    topic = spelling["corrected"]

    parsed = generate_content(topic, req.audience, req.platforms, req.languages)
    image_prompt = parsed.get("image_prompt", "")

    generated_image_url = None
    if image_prompt:
        generated_image_url = generate_image_huggingface(image_prompt)

    return GenerateResponse(
        content=parsed.get("content", {}),
        translations=parsed.get("translations", {}),
        hashtags=parsed.get("hashtags", []),
        image_prompt=image_prompt,
        image_url=generated_image_url,
        spelling=spelling
    )