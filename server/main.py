from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Office Suite Engine")

# Configure CORS
import os

# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Configured via ALLOWED_ORIGINS env var
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

from api.routes import router as api_router

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "AI Office Suite Engine is running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
