# AI Office Suite Server

## Quick Start

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

## API Endpoints

- `GET /` - Health check
- `GET /api/status` - Get engine status
- `POST /api/generate` - Generate document
- `GET /api/download/{filename}` - Download generated file

## Example Request

```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"type": "word", "title": "My Report", "content": "This is a test document."}'
```
