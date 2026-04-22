# PostCraft AI Backend

FastAPI backend for generating a complete social media content kit with Groq. The API returns platform captions, translations, hashtags, a copy-paste image prompt, a design brief, CTA suggestions, and posting tips.

## Stack
- FastAPI for the API server
- Groq chat completions for content generation
- Pydantic for request and response validation
- PySpellChecker for topic spelling correction

## Setup

### 1. Install dependencies
```bash
cd Backend
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
```

Set these values in `.env`:
```env
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

`GROQ_API_KEY` is required. The app does not call an image API; instead it returns an `image_prompt` that users can paste into ChatGPT, DALL-E, Canva, Leonardo, Bing Image Creator, or another image tool.

### 3. Run the server
```bash
uvicorn main:app --reload --port 8000
```

Server: http://localhost:8000
Docs: http://localhost:8000/docs

## API

### POST `/generate`

Request:
```json
{
  "topic": "Ram Navami wishes",
  "audience": "General Public",
  "platforms": ["LinkedIn", "Instagram"],
  "languages": ["English", "Hindi"]
}
```

Response:
```json
{
  "content": {
    "LinkedIn": "...",
    "Instagram": "..."
  },
  "translations": {
    "Hindi": "..."
  },
  "hashtags": ["RamNavami", "Festival", "India", "Blessings", "Joy"],
  "image_prompt": "Create a festive social media banner for Ram Navami...",
  "design_brief": "Use saffron and gold colors, devotional mood, clean spacing...",
  "cta_suggestions": [
    "Share your wishes in the comments.",
    "Save this post for later.",
    "Tag someone who celebrates this festival."
  ],
  "posting_tips": [
    "Use the Instagram caption with a bright festive visual.",
    "Keep LinkedIn hashtags limited to the most relevant 3 to 5 tags.",
    "Reply quickly to early comments to improve engagement."
  ],
  "spelling": {
    "original": "Ram Navami wishes",
    "corrected": "Ram Navami wishes",
    "is_correct": true,
    "suggestions": {}
  }
}
```

## Frontend Flow

```text
Topic + audience + platforms + languages
-> Groq content kit generation
-> Captions and translations
-> Hashtags
-> Copy-paste image prompt
-> Design brief
-> CTA suggestions
-> Posting tips
```

## Frontend Connection

The React frontend reads the backend URL from `VITE_API_BASE_URL` and defaults to `http://localhost:8000`.

Create `Frontend/.env` from `Frontend/.env.example` if you need a different backend URL.

## Project Structure

```text
Backend/
  main.py
  requirements.txt
  .env.example
  README.md
  test_caption_length.py
  test_groq.py
  test_groq_full.py
```
