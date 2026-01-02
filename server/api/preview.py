import os
import mammoth
import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

router = APIRouter()

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'output')

@router.get("/preview/{filename}")
async def preview_document(filename: str):
    """Generate HTML preview for a document."""
    # Security: validate filename to prevent path traversal
    if not filename or "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        if filename.lower().endswith(".docx"):
            with open(filepath, "rb") as docx_file:
                result = mammoth.convert_to_html(docx_file)
                return HTMLResponse(content=result.value)
                
        elif filename.lower().endswith(".xlsx"):
            # Read first sheet
            df = pd.read_excel(filepath)
            html = df.to_html(classes="table table-striped table-hover", index=False)
            # Add some basic styling for the table
            styled_html = f"""
            <style>
                .table {{ width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px; color: #333; }}
                .table th {{ background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: 600; }}
                .table td {{ border: 1px solid #dee2e6; padding: 12px; }}
                .table-striped tbody tr:nth-of-type(odd) {{ background-color: rgba(0,0,0,.05); }}
            </style>
            <div style="overflow-x: auto;">
                {html}
            </div>
            """
            return HTMLResponse(content=styled_html)
            
        elif filename.lower().endswith(".pptx"):
            # For PPT, we'll just return a placeholder for now as OCR/rendering is complex
            # In a real app, you might convert to PDF or images
            return HTMLResponse(content="<div style='padding: 20px; text-align: center; color: #666;'><h3>PowerPoint 预览暂不支持完美渲染</h3><p>建议直接下载查看。</p></div>")
            
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type for preview")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")
