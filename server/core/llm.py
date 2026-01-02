import os
import json
import re
import logging
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

# Configure logging to avoid leaking sensitive info
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class DocumentSection(BaseModel):
    """A section of a document."""
    heading: Optional[str] = None
    content: str
    level: int = 1
    style: Optional[Dict[str, Any]] = None


class DocumentStructure(BaseModel):
    """Structured representation of a document."""
    title: str
    sections: List[DocumentSection]
    style_guide: Optional[Dict[str, Any]] = None


class SpreadsheetData(BaseModel):
    """Structured representation of spreadsheet data."""
    title: str
    headers: List[str]
    rows: List[List[Any]]
    formulas: Optional[Dict[str, str]] = None


class PresentationStructure(BaseModel):
    """Structured representation of a presentation."""
    title: str
    subtitle: Optional[str] = None
    slides: List[Dict[str, Any]]


class LLMService:
    """
    AI service for generating structured document content.
    Supports OpenAI, Anthropic, or local models.
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("LLM_MODEL", "google/gemini-2.0-flash-001")
        self.client = None
        
        if self.api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(
                    api_key=self.api_key,
                    base_url="https://openrouter.ai/api/v1",
                    default_headers={
                        "HTTP-Referer": "http://localhost:5173",
                        "X-Title": "AI Office Suite"
                    }
                )
            except ImportError:
                logger.warning("OpenAI package not installed. Using mock generation.")
    
    async def generate_document_structure(
        self,
        user_prompt: str,
        doc_type: str,
        style_guide: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate structured document content from natural language.
        
        Args:
            user_prompt: User's description of what they want
            doc_type: 'word', 'excel', or 'ppt'
            style_guide: Optional style preferences
            
        Returns:
            Structured document data ready for engine processing
        """
        if doc_type == 'word':
            return await self._generate_word_structure(user_prompt, style_guide)
        elif doc_type == 'excel':
            return await self._generate_excel_structure(user_prompt)
        elif doc_type == 'ppt':
            return await self._generate_ppt_structure(user_prompt)
        else:
            raise ValueError(f"Unknown document type: {doc_type}")
    
    async def _generate_word_structure(
        self,
        user_prompt: str,
        style_guide: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate Word document structure."""
        
        system_prompt = """You are a professional document writer. Generate a structured document based on the user's request.
Output a JSON object with:
- title: Document title
- sections: Array of sections, each with:
  - heading: Section heading (optional)
  - content: Section text content
  - level: Heading level (1-3)
- style_guide: Optional formatting preferences extracted from the request (font_name, font_size, line_spacing, etc.)

Parse any style requirements from the user's request (e.g., "12pt font", "1.5 line spacing", "Times New Roman").
Respond ONLY with valid JSON, no markdown."""

        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                return json.loads(response.choices[0].message.content)
            except Exception as e:
                logger.error("LLM generation failed", exc_info=False)
                return self._mock_word_structure(user_prompt)
        else:
            return self._mock_word_structure(user_prompt)
    
    async def _generate_excel_structure(self, user_prompt: str) -> Dict[str, Any]:
        """Generate Excel spreadsheet structure."""
        
        system_prompt = """You are a data analyst. Generate structured spreadsheet data based on the user's request.
Output a JSON object with:
- title: Sheet title
- headers: Array of column headers
- rows: 2D array of data (each inner array is a row)
- formulas: Optional dict of cell references to formulas (e.g., {"A10": "=SUM(A1:A9)"})

Generate realistic sample data if specific data is not provided.
Respond ONLY with valid JSON, no markdown."""

        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                return json.loads(response.choices[0].message.content)
            except Exception as e:
                logger.error("LLM generation failed", exc_info=False)
                return self._mock_excel_structure(user_prompt)
        else:
            return self._mock_excel_structure(user_prompt)
    
    async def _generate_ppt_structure(self, user_prompt: str) -> Dict[str, Any]:
        """Generate PowerPoint presentation structure."""
        
        system_prompt = """You are a presentation designer. Generate a structured presentation based on the user's request.
Output a JSON object with:
- title: Presentation title
- subtitle: Optional subtitle
- slides: Array of slide objects, each with:
  - type: 'title', 'content', 'two_column', or 'image'
  - title: Slide title
  - content: Array of bullet points or text content
  - notes: Optional speaker notes

Create 5-10 slides for a comprehensive presentation.
Respond ONLY with valid JSON, no markdown."""

        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                return json.loads(response.choices[0].message.content)
            except Exception as e:
                logger.error("LLM generation failed", exc_info=False)
                return self._mock_ppt_structure(user_prompt)
        else:
            return self._mock_ppt_structure(user_prompt)
    
    def _mock_word_structure(self, user_prompt: str) -> Dict[str, Any]:
        """Generate mock Word structure when LLM is unavailable."""
        # Parse style info from prompt
        style_guide = self._parse_style_from_prompt(user_prompt)
        
        return {
            "title": "Generated Document",
            "sections": [
                {
                    "heading": "Introduction",
                    "content": f"This document was generated based on: {user_prompt}",
                    "level": 1
                },
                {
                    "heading": "Content",
                    "content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
                    "level": 1
                },
                {
                    "heading": "Conclusion",
                    "content": "This concludes the document. Please provide an API key for AI-generated content.",
                    "level": 1
                }
            ],
            "style_guide": style_guide
        }
    
    def _mock_excel_structure(self, user_prompt: str) -> Dict[str, Any]:
        """Generate mock Excel structure when LLM is unavailable."""
        return {
            "title": "Data Sheet",
            "headers": ["Name", "Value", "Category", "Date"],
            "rows": [
                ["Item 1", 100, "A", "2024-01-01"],
                ["Item 2", 200, "B", "2024-01-02"],
                ["Item 3", 150, "A", "2024-01-03"],
                ["Item 4", 300, "C", "2024-01-04"],
                ["Item 5", 250, "B", "2024-01-05"],
            ],
            "formulas": {
                "B7": "=SUM(B2:B6)"
            }
        }
    
    def _mock_ppt_structure(self, user_prompt: str) -> Dict[str, Any]:
        """Generate mock PPT structure when LLM is unavailable."""
        return {
            "title": "Presentation",
            "subtitle": f"Generated from: {user_prompt[:50]}...",
            "slides": [
                {
                    "type": "title",
                    "title": "Welcome",
                    "content": ["AI Office Suite", "Powered by Advanced AI"]
                },
                {
                    "type": "content",
                    "title": "Overview",
                    "content": [
                        "Introduction to the topic",
                        "Key points to discuss",
                        "Benefits and features"
                    ]
                },
                {
                    "type": "content",
                    "title": "Details",
                    "content": [
                        "First major point",
                        "Second major point",
                        "Third major point"
                    ]
                },
                {
                    "type": "content",
                    "title": "Conclusion",
                    "content": [
                        "Summary of key points",
                        "Next steps",
                        "Thank you!"
                    ]
                }
            ]
        }
    
    def _parse_style_from_prompt(self, prompt: str) -> Dict[str, Any]:
        """Extract style information from user prompt."""
        style = {}
        prompt_lower = prompt.lower()
        
        # Parse font size
        size_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:pt|point|号)', prompt_lower)
        if size_match:
            style['font_size'] = float(size_match.group(1))
        
        # Parse line spacing
        spacing_patterns = [
            (r'(\d+(?:\.\d+)?)\s*倍行距', lambda m: float(m.group(1))),
            (r'(\d+(?:\.\d+)?)\s*line\s*spacing', lambda m: float(m.group(1))),
            (r'single\s*spac', lambda m: 1.0),
            (r'double\s*spac', lambda m: 2.0),
            (r'1\.5\s*spac', lambda m: 1.5),
        ]
        for pattern, extractor in spacing_patterns:
            match = re.search(pattern, prompt_lower)
            if match:
                style['line_spacing'] = extractor(match)
                break
        
        # Parse font name
        font_patterns = [
            r'(arial|times new roman|calibri|宋体|黑体|微软雅黑|楷体)',
        ]
        for pattern in font_patterns:
            match = re.search(pattern, prompt_lower)
            if match:
                style['font_name'] = match.group(1).title()
                break
        
        # Parse margins
        margin_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:cm|厘米)\s*(?:margin|边距)', prompt_lower)
        if margin_match:
            style['margin'] = float(margin_match.group(1))
        
        return style


# Global instance
llm_service = LLMService()

