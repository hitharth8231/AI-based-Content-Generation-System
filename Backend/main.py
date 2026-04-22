import base64
import io
import json
import os
import re
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from spellchecker import SpellChecker

load_dotenv()

SUPPORTED_PLATFORMS = {"LinkedIn", "Instagram", "Twitter", "Facebook"}
SUPPORTED_LANGUAGES = {"English", "Hindi", "Hinglish", "Bengali", "Tamil"}
MIN_CAPTION_WORDS = 35
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
HF_IMAGE_MODEL = os.getenv("HF_IMAGE_MODEL", "stabilityai/stable-diffusion-2-1")


def get_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app = FastAPI(title="PostCraft AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

spell = SpellChecker()


class GenerateRequest(BaseModel):
    topic: str
    audience: str = "General Public"
    platforms: list[str] = Field(default_factory=lambda: ["LinkedIn", "Instagram"])
    languages: list[str] = Field(default_factory=lambda: ["English"])


class GenerateResponse(BaseModel):
    content: dict[str, Any]
    translations: dict[str, Any]
    hashtags: list[str]
    image_prompt: str
    image_url: str | None = None
    image_error: str | None = None
    spelling: dict[str, Any] = Field(default_factory=dict)


SYSTEM_PROMPT = """
You are a JSON generator for social media content.

STRICT RULES:
- Return ONLY valid JSON
- No explanation
- No markdown
- Close all quotes properly
- Only include the requested platforms
- Only include the requested non-English translations
- Every platform caption in "content" must be at least 35 words long

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
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "image_prompt": "..."
}
"""


def safe_parse_json(text: str) -> dict[str, Any] | None:
    try:
        clean_text = re.sub(r"```(?:json)?|```", "", text).strip()
        start = clean_text.find("{")
        end = clean_text.rfind("}") + 1

        if start == -1 or end <= start:
            return None

        return json.loads(clean_text[start:end])
    except (TypeError, json.JSONDecodeError) as exc:
        print("JSON parse failed:", exc)
        return None


def check_and_correct_topic(topic: str) -> dict[str, Any]:
    words = re.findall(r"[A-Za-z']+", topic.lower())
    misspelled = spell.unknown(words)

    if not misspelled:
        return {"original": topic, "corrected": topic, "is_correct": True, "suggestions": {}}

    corrected_words: list[str] = []
    suggestions: dict[str, list[str]] = {}

    for word in words:
        if word in misspelled:
            likely = spell.correction(word) or word
            candidates = spell.candidates(word) or {likely}
            suggestions[word] = list(candidates)[:3]
            corrected_words.append(likely)
        else:
            corrected_words.append(word)

    return {
        "original": topic,
        "corrected": " ".join(corrected_words),
        "is_correct": False,
        "suggestions": suggestions,
        "misspelled_words": sorted(misspelled),
    }


def validate_choices(values: list[str], supported: set[str], field_name: str) -> list[str]:
    cleaned = [value for value in values if value in supported]
    if not cleaned:
        allowed = ", ".join(sorted(supported))
        raise HTTPException(status_code=400, detail=f"Choose at least one valid {field_name}: {allowed}")
    return cleaned


def count_words(value: Any) -> int:
    return len(re.findall(r"\b[\w'-]+\b", str(value)))


def ensure_minimum_caption_length(content: dict[str, Any], topic: str, audience: str) -> dict[str, str]:
    cleaned: dict[str, str] = {}

    for platform, caption in content.items():
        text = str(caption).strip()
        if count_words(text) < MIN_CAPTION_WORDS:
            text = (
                f"{text} Explore {topic} with a clear, useful perspective created for {audience}. "
                "This caption highlights the key idea, builds interest, encourages action, "
                "and gives the audience a practical reason to engage with the post today."
            ).strip()
        cleaned[platform] = text

    return cleaned


def generate_content(topic: str, audience: str, platforms: list[str], languages: list[str]) -> dict[str, Any]:
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured on the backend.")

    requested_translations = [language for language in languages if language != "English"]
    user_message = f"""
Topic: {topic}
Audience: {audience}
Platforms: {", ".join(platforms)}
Languages: {", ".join(requested_translations) if requested_translations else "None"}
Minimum caption length: every requested platform caption must contain at least 35 words.
Return only JSON.
"""

    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                "temperature": 0.7,
                "response_format": {"type": "json_object"},
            },
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()
        raw = data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:300]
        raise HTTPException(status_code=502, detail=f"Groq API error: {detail}") from exc
    except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"Could not generate content: {exc}") from exc

    parsed = safe_parse_json(raw)
    if not parsed:
        return {
            "content": ensure_minimum_caption_length({platforms[0]: raw[:300]}, topic, audience),
            "translations": {},
            "hashtags": [],
            "image_prompt": "",
        }

    parsed["content"] = ensure_minimum_caption_length(parsed.get("content", {}), topic, audience)
    return parsed


def is_configured_secret(value: str | None, placeholder: str) -> bool:
    return bool(value and value.strip() and value.strip() != placeholder)


def generate_image_huggingface(prompt: str) -> tuple[str | None, str | None]:
    hf_token = os.getenv("HF_TOKEN")
    if not is_configured_secret(hf_token, "replace_with_your_hugging_face_token"):
        return None, "HF_TOKEN is not configured in Backend/.env."

    try:
        from huggingface_hub import InferenceClient

        client = InferenceClient(api_key=hf_token)
        image = client.text_to_image(prompt, model=HF_IMAGE_MODEL)

        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{encoded}", None
    except Exception as exc:
        message = f"Hugging Face image generation failed: {exc}"
        print(message)
        return None, message


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "running"}


@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest) -> GenerateResponse:
    topic_input = req.topic.strip()
    if not topic_input:
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    platforms = validate_choices(req.platforms, SUPPORTED_PLATFORMS, "platform")
    languages = validate_choices(req.languages, SUPPORTED_LANGUAGES, "language")

    spelling = check_and_correct_topic(topic_input)
    parsed = generate_content(spelling["corrected"], req.audience, platforms, languages)
    image_prompt = parsed.get("image_prompt", "")
    image_url = None
    image_error = None
    if image_prompt:
        image_url, image_error = generate_image_huggingface(image_prompt)
    else:
        image_error = "Groq did not return an image prompt."

    return GenerateResponse(
        content=parsed.get("content", {}),
        translations=parsed.get("translations", {}),
        hashtags=parsed.get("hashtags", []),
        image_prompt=image_prompt,
        image_url=image_url,
        image_error=image_error,
        spelling=spelling,
    )
