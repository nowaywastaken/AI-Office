from pydantic import BaseModel, Field
from typing import Optional, List, Union, Literal

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

class AIConfig(BaseModel):
    provider: Optional[str] = Field(None, description="AI provider (e.g., 'openai', 'anthropic')")
    api_key: Optional[str] = Field(None, description="API key")
    base_url: Optional[str] = Field(None, description="Base URL for the API")
    model: Optional[str] = Field(None, description="Model name")

class DocumentRequest(BaseModel):
    title: str = Field(default="Document", min_length=1, max_length=200)
    content: str = Field(..., description="Natural language description of the document or raw content", min_length=1, max_length=50000)
    type: Literal["word", "excel", "ppt"] = Field(..., description="Document type")
    style_guide: Optional[str] = Field(None, description="Description of the desired style", max_length=2000)
    api_config: Optional[AIConfig] = Field(None, description="Custom AI configuration")

class GenerationResponse(BaseModel):
    file_url: str
    preview_url: Optional[str] = None
    message: str
