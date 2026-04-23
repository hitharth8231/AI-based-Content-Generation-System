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


def get_cors_origins() -> list[str]:
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,https://ai-based-content-generation-system-ten.vercel.app"
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app = FastAPI(title="PostCraft AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    design_brief: str
    cta_suggestions: list[str]
    posting_tips: list[str]
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
- "image_prompt" must be ready to paste into ChatGPT, DALL-E, Canva, Leonardo, or Bing Image Creator
- "design_brief" must be a practical banner/design direction, not an image URL
- "cta_suggestions" must contain 3 short call-to-action options
- "posting_tips" must contain 3 practical posting tips

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
  "image_prompt": "A ready-to-paste image generation prompt...",
  "design_brief": "A short design brief with layout, colors, mood, main text, and visual elements.",
  "cta_suggestions": ["...", "...", "..."],
  "posting_tips": ["...", "...", "..."]
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


def build_image_prompt(topic: str, audience: str, fallback: str = "") -> str:
    if fallback.strip():
        return fallback.strip()

    return (
        f"Create a high-quality social media banner for '{topic}' aimed at {audience}. "
        "Use a clear focal point, bold readable headline area, modern composition, strong visual hierarchy, "
        "soft background shapes, polished lighting, and platform-ready spacing. Make it clean, shareable, "
        "professional, and suitable for Instagram, LinkedIn, Facebook, and X."
    )


def build_design_brief(topic: str, audience: str, fallback: str = "") -> str:
    if fallback.strip():
        return fallback.strip()

    return (
        f"Design a polished visual for '{topic}' aimed at {audience}. Use a bold headline, one short "
        "supporting line, a high-contrast color palette, simple icon or illustration elements, and enough "
        "empty space for readability. Keep the mood modern, useful, and easy to adapt in Canva or Figma."
    )


def normalize_list(value: Any, fallback: list[str], limit: int = 3) -> list[str]:
    if isinstance(value, list):
        cleaned = [str(item).strip() for item in value if str(item).strip()]
        return (cleaned or fallback)[:limit]
    return fallback[:limit]


def default_ctas(topic: str) -> list[str]:
    return [
        f"Share your thoughts on {topic} in the comments.",
        "Save this post for later and revisit it when needed.",
        "Tag someone who would find this useful today.",
    ]


def default_posting_tips(platforms: list[str]) -> list[str]:
    platform_text = ", ".join(platforms)
    return [
        f"Adapt the opening line slightly for {platform_text} before posting.",
        "Use only the most relevant 3 to 5 hashtags for a cleaner professional look.",
        "Post when your audience is active and reply quickly to early comments.",
    ]


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
Return image_prompt, design_brief, cta_suggestions, and posting_tips. Do not generate an image URL.
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
            "image_prompt": build_image_prompt(topic, audience),
            "design_brief": build_design_brief(topic, audience),
            "cta_suggestions": default_ctas(topic),
            "posting_tips": default_posting_tips(platforms),
        }

    parsed["content"] = ensure_minimum_caption_length(parsed.get("content", {}), topic, audience)
    parsed["image_prompt"] = build_image_prompt(
        topic,
        audience,
        parsed.get("image_prompt") or "",
    )
    parsed["design_brief"] = build_design_brief(topic, audience, parsed.get("design_brief") or "")
    parsed["cta_suggestions"] = normalize_list(parsed.get("cta_suggestions"), default_ctas(topic))
    parsed["posting_tips"] = normalize_list(parsed.get("posting_tips"), default_posting_tips(platforms))
    return parsed


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

    return GenerateResponse(
        content=parsed.get("content", {}),
        translations=parsed.get("translations", {}),
        hashtags=parsed.get("hashtags", []),
        image_prompt=parsed.get("image_prompt", build_image_prompt(spelling["corrected"], req.audience)),
        design_brief=parsed.get("design_brief", build_design_brief(spelling["corrected"], req.audience)),
        cta_suggestions=parsed.get("cta_suggestions", default_ctas(spelling["corrected"])),
        posting_tips=parsed.get("posting_tips", default_posting_tips(platforms)),
        spelling=spelling,
    )
