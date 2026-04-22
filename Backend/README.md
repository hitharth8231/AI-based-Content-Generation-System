# PostCraft AI Backend

FastAPI backend for generating platform-specific social posts with Groq. The app returns captions, translations, hashtags, and a practical visual brief that can be used in Canva, Figma, or manual design.

## Stack
- FastAPI for the API server
- Groq chat completions for post generation
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

`GROQ_API_KEY` is required. Image generation APIs are intentionally not used; the backend returns a stable `visual_brief` instead of trying to generate an image.

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
  "visual_brief": "Create a clean social media banner with a bold headline, warm colors, and festive visual elements...",
  "spelling": {
    "original": "Ram Navami wishes",
    "corrected": "Ram Navami wishes",
    "is_correct": true,
    "suggestions": {}
  }
}
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
