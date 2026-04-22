# PostCraft AI Backend

FastAPI backend for generating platform-specific social posts with Groq and optional AI image generation through Hugging Face Inference.

## Stack
- FastAPI for the API server
- Groq chat completions for post generation
- Hugging Face Inference for optional image generation
- Pydantic for request and response validation

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
HF_TOKEN=your_hugging_face_token
GROQ_MODEL=llama-3.1-8b-instant
HF_IMAGE_MODEL=stabilityai/stable-diffusion-2-1
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

`GROQ_API_KEY` is required. `HF_TOKEN` is optional; without it the API still returns content and an image prompt, but `image_url` will be `null` and `image_error` will explain why.

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
  "image_prompt": "A vibrant saffron-themed Ram Navami banner...",
  "image_url": null,
  "image_error": "HF_TOKEN is not configured in Backend/.env.",
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
  test_groq.py
  test_groq_full.py
```

