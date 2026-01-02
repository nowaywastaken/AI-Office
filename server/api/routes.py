from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from sse_starlette.sse import EventSourceResponse
from api.models import (
    DocumentRequest, 
    GenerationResponse, 
    StreamGenerationRequest, 
    ModificationRequest
)
from core.llm import llm_service
import json
import uuid
import os
import re

router = APIRouter()

# Ensure output directory exists
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'output')
os.makedirs(OUTPUT_DIR, exist_ok=True)

@router.get("/status")
async def get_status():
    return {
        "status": "operational",
        "components": ["word", "excel", "ppt"],
        "ai_enabled": llm_service.client is not None
    }

@router.post("/generate", response_model=GenerationResponse)
async def generate_document(request: DocumentRequest):
    """Generate a document based on user request using AI."""
    
    # Import tools here to avoid circular dependencies if any, 
    # though core.tools imports core.llm which is fine.
    from core.tools import word_tool, excel_tool, ppt_tool
    
    try:
        # Auto-detect document type if not provided
        doc_type = request.type
        if not doc_type:
            doc_type = await llm_service.detect_document_type(
                user_prompt=request.content,
                config=request.api_config.dict() if request.api_config else None
            )
        
        result = None
        
        if doc_type == 'word':
            result = await word_tool.run(
                prompt=request.content,
                title=request.title,
                style_guide=request.style_guide,
                api_config=request.api_config.dict() if request.api_config else None
            )
        elif doc_type == 'excel':
            result = await excel_tool.run(
                prompt=request.content,
                title=request.title,
                api_config=request.api_config.dict() if request.api_config else None
            )
        elif doc_type == 'ppt':
            result = await ppt_tool.run(
                prompt=request.content,
                title=request.title,
                api_config=request.api_config.dict() if request.api_config else None
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unknown document type: {doc_type}")
        
        if not result.success:
             raise Exception(result.error or "Unknown error during generation")

        return GenerationResponse(
            file_url=result.data.get("file_url"),
            message=result.message,
            structure=result.data.get("structure")
        )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/stream")
async def generate_document_stream(request: StreamGenerationRequest, fast_request: Request):
    """Stream doc content and structure."""
    try:
        doc_type = request.type
        if not doc_type:
            doc_type = await llm_service.detect_document_type(
                user_prompt=request.prompt,
                config=request.api_config.dict() if request.api_config else None
            )

        async def event_generator():
            async for chunk in llm_service.generate_document_structure_stream(
                user_prompt=request.prompt,
                doc_type=doc_type,
                config=request.api_config.dict() if request.api_config else None,
                context=request.context
            ):
                if await fast_request.is_disconnected():
                    break
                yield {"data": chunk}

        return EventSourceResponse(event_generator())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/modify", response_model=GenerationResponse)
async def modify_document(request: ModificationRequest):
    """Iteratively modify an existing document structure."""
    from core.tools import word_tool, excel_tool, ppt_tool
    
    try:
        # 1. Update structure via LLM
        # We pass the current structure as context
        context = [
            {"role": "assistant", "content": f"Current structure: {json.dumps(request.current_structure)}"}
        ]
        
        new_structure = await llm_service.generate_document_structure(
            user_prompt=request.instruction,
            doc_type=request.doc_type,
            config=request.api_config.dict() if request.api_config else None,
            context=context
        )
        
        # 2. Re-generate File
        doc_id = str(uuid.uuid4())
        result = None
        
        if request.doc_type == 'word':
            filepath = await word_tool._generate_file(doc_id, new_structure, new_structure.get('title', 'Modified'))
            result_data = {
                "file_url": f"/api/download/{os.path.basename(filepath)}",
                "structure": new_structure
            }
        elif request.doc_type == 'excel':
            filepath = await excel_tool._generate_file(doc_id, new_structure, new_structure.get('title', 'Modified'))
            result_data = {
                "file_url": f"/api/download/{os.path.basename(filepath)}",
                "structure": new_structure
            }
        elif request.doc_type == 'ppt':
            filepath = await ppt_tool._generate_file(doc_id, new_structure, new_structure.get('title', 'Modified'))
            result_data = {
                "file_url": f"/api/download/{os.path.basename(filepath)}",
                "structure": new_structure
            }
        
        return GenerationResponse(
            file_url=result_data["file_url"],
            message="Document updated successfully",
            structure=new_structure
        )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/download/{filename}")
async def download_file(filename: str):
    """Download a generated file."""
    # Security: validate filename to prevent path traversal
    if not filename or "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    # Only allow expected file extensions
    allowed_extensions = (".docx", ".xlsx", ".pptx")
    if not filename.lower().endswith(allowed_extensions):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    # Verify the resolved path is within OUTPUT_DIR
    if not os.path.realpath(filepath).startswith(os.path.realpath(OUTPUT_DIR)):
        raise HTTPException(status_code=400, detail="Invalid path")
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(filepath, filename=filename)

