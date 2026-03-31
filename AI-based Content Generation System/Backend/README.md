# PostCraft AI — FastAPI Backend

## Stack
- **FastAPI** — API framework
- **Groq** (llama-3.3-70b) — Content generation agent
- **Hugging face ** (flux-schnell) — AI image generation
- **Pydantic** — Request/response validation

---

## Setup in 3 Steps

### 1. Install dependencies
```bash
cd postcraft-backend
pip install -r requirements.txt
```

### 2. Set up API keys
```bash
cp .env.example .env
```
Then open `.env` and paste your keys:
- **GROQ_API_KEY** → Get free at https://console.groq.com/keys
- **HUGGINGFACE_API_TOKEN** → Get at https://huggingface.com/account/api-tokens

### 3. Run the server
```bash
uvicorn main:app --reload --port 8000
```

Server runs at → http://localhost:8000  
Docs (Swagger UI) → http://localhost:8000/docs

---

## API Reference

### POST /generate

**Request body:**
```json
{
  "topic": "Ram Navami wishes",
  "audience": "General Public",
  "platforms": ["LinkedIn", "Instagram"],
  "languages": ["English", "Hindi"]
}
```

**Response:**
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
  "image_url": "https://replicate.delivery/..."
}
```

---

## Connect to React Frontend

In your React app, update the generate function to call your backend instead of the Anthropic API directly:

```js
const response = await fetch("http://localhost:8000/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ topic, audience, platforms, languages })
});
const data = await response.json();
// data.image_url is now a real image from HUGGING FACE!
```

---

## Models Used

| Task | Model | Speed |
|------|-------|-------|
| Content generation | Groq llama-3.3-70b-versatile | ~1–2s |
| Image generation | HUGGING FACE flux-schnell | ~3–5s |

---

## Project Structure

```
postcraft-backend/
├── main.py           ← All backend logic
├── requirements.txt  ← Python dependencies  
├── .env.example      ← Copy to .env and add keys
└── README.md         ← This file
```
