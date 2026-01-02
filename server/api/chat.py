from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from core.llm import llm_service
from api.models import AIConfig
from sse_starlette.sse import EventSourceResponse
import json

router = APIRouter()

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    api_config: Optional[AIConfig] = None

class ChatResponse(BaseModel):
    message: str
    ready_to_generate: bool = False
    detected_type: Optional[str] = None
    summary: Optional[str] = None

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Have a conversation with the AI to clarify document requirements.
    When ready_to_generate is True, the user can proceed to generate.
    """
    try:
        # Convert to list of dicts for LLM
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        
        result = await llm_service.chat(
            messages=messages,
            config=request.api_config.dict() if request.api_config else None
        )
        
        return ChatResponse(
            message=result["message"],
            ready_to_generate=result.get("ready_to_generate", False),
            detected_type=result.get("detected_type"),
            summary=result.get("summary")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, fast_request: Request):
    """
    Streamed conversation with the AI.
    """
    try:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        
        async def event_generator():
            async for chunk in llm_service.chat_stream(
                messages=messages,
                config=request.api_config.dict() if request.api_config else None
            ):
                if await fast_request.is_disconnected():
                    break
                yield {"data": chunk}

        return EventSourceResponse(event_generator())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

