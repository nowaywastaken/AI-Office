from pydantic import BaseModel, Field
from typing import Optional, List, Union

class FontStyle(BaseModel):
    name: Optional[str] = Field(None, description="Font family name (e.g., 'Arial', 'Times New Roman')")
    size: Optional[float] = Field(None, description="Font size in points (pt)")
    bold: Optional[bool] = None
    italic: Optional[bool] = None
    color: Optional[str] = Field(None, description="Hex color code (e.g., '#FF0000')")

class ParagraphStyle(BaseModel):
    alignment: Optional[str] = Field(None, description="'left', 'center', 'right', 'justify'")
    line_spacing: Optional[float] = Field(None, description="Line spacing multiplier")
    space_before: Optional[float] = Field(None, description="Spacing before paragraph in points")
    space_after: Optional[float] = Field(None, description="Spacing after paragraph in points")

class DocumentRequest(BaseModel):
    title: str = "Presentation"
    content: str = Field(..., description="Natural language description of the document or raw content")
    type: str = Field(..., description="'word', 'excel', 'ppt'")
    style_guide: Optional[str] = Field(None, description="Description of the desired style")

class GenerationResponse(BaseModel):
    file_url: str
    preview_url: Optional[str] = None
    message: str
