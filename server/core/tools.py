import os
import uuid
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

from core.llm import llm_service
from core.engine_word import WordEngine
from core.engine_excel import ExcelEngine
from core.engine_ppt import PPTEngine

logger = logging.getLogger(__name__)

# Ensure output directory exists (shared constant)
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'output')
os.makedirs(OUTPUT_DIR, exist_ok=True)

class ToolResult(BaseModel):
    """Standardized result from a tool execution."""
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    error: Optional[str] = None
    artifacts: Optional[List[str]] = None  # Paths to generated files

class BaseTool(ABC):
    """Abstract base class for all tools."""
    name: str = "base_tool"
    description: str = "Base tool description"

    @abstractmethod
    async def run(self, *args, **kwargs) -> ToolResult:
        pass

class WordGenerationTool(BaseTool):
    """Tool for generating Word documents."""
    name = "generate_word_document"
    description = "Generates a Word document based on a user prompt and optional style guide."

    async def run(
        self, 
        prompt: str, 
        title: str = "Generated Document", 
        style_guide: Optional[Dict[str, Any]] = None,
        api_config: Optional[Dict[str, Any]] = None
    ) -> ToolResult:
        try:
            doc_id = str(uuid.uuid4())
            
            # 1. Generate Structure using LLM
            structure = await llm_service.generate_document_structure(
                user_prompt=prompt,
                doc_type='word',
                style_guide=None, # Passed in prompt parsing or strictly enforced? 
                                  # llm.py handles style guide parsing from prompt too.
                                  # Let's keep it simple and just pass prompt.
                config=api_config
            )
            
            # If explicit style guide provided, override or merge?
            # For now, let's assume the LLM structure might include style info parsed from prompt,
            # but we can overlay explicit settings if we had them.
            if style_guide:
                if 'style_guide' not in structure:
                    structure['style_guide'] = {}
                structure['style_guide'].update(style_guide)

            # 2. Generate File using Engine
            filepath = await self._generate_file(doc_id, structure, title)
            
            return ToolResult(
                success=True,
                data={
                    "file_path": filepath,
                    "file_name": os.path.basename(filepath),
                    "file_url": f"/api/download/{os.path.basename(filepath)}",
                    "title": structure.get('title', title),
                    "structure": structure
                },
                message=f"Successfully generated Word document: {structure.get('title', title)}",
                artifacts=[filepath]
            )
            
        except Exception as e:
            logger.error(f"Word generation failed: {e}", exc_info=True)
            return ToolResult(success=False, error=str(e))

    async def _generate_file(self, doc_id: str, structure: dict, fallback_title: str) -> str:
        engine = WordEngine()
        
        # Apply style guide
        style = structure.get('style_guide', {})
        if style:
            margin = style.get('margin', 2.54)
            engine.set_page_margins(top=margin, bottom=margin, left=margin, right=margin)
        else:
            engine.set_page_margins(top=2.54, bottom=2.54, left=3.18, right=3.18)
        
        # Content
        title = structure.get('title', fallback_title)
        engine.add_heading(title, level=1)
        
        for section in structure.get('sections', []):
            if section.get('heading'):
                engine.add_heading(section['heading'], level=section.get('level', 2))
            
            engine.add_paragraph(
                section.get('content', ''),
                font_name=style.get('font_name', 'Arial'),
                font_size=style.get('font_size', 12),
                line_spacing=style.get('line_spacing', 1.5),
                line_spacing_rule='multiple',
                space_after=12
            )
        
        filepath = os.path.join(OUTPUT_DIR, f"{doc_id}.docx")
        engine.save(filepath)
        return filepath

class ExcelGenerationTool(BaseTool):
    """Tool for generating Excel spreadsheets."""
    name = "generate_excel_spreadsheet"
    description = "Generates an Excel spreadsheet based on a user prompt."

    async def run(
        self, 
        prompt: str, 
        title: str = "Generated Sheet", 
        api_config: Optional[Dict[str, Any]] = None
    ) -> ToolResult:
        try:
            doc_id = str(uuid.uuid4())
            
            # 1. Generate Structure
            structure = await llm_service.generate_document_structure(
                user_prompt=prompt,
                doc_type='excel',
                config=api_config
            )
            
            # 2. Generate File
            filepath = await self._generate_file(doc_id, structure, title)
            
            return ToolResult(
                success=True,
                data={
                    "file_path": filepath,
                    "file_name": os.path.basename(filepath),
                    "file_url": f"/api/download/{os.path.basename(filepath)}",
                    "title": structure.get('title', title),
                    "structure": structure
                },
                message=f"Successfully generated Excel file: {structure.get('title', title)}",
                artifacts=[filepath]
            )

        except Exception as e:
            logger.error(f"Excel generation failed: {e}", exc_info=True)
            return ToolResult(success=False, error=str(e))

    async def _generate_file(self, doc_id: str, structure: dict, fallback_title: str) -> str:
        engine = ExcelEngine()
        
        title = structure.get('title', fallback_title)
        engine.set_sheet_name(title[:31])
        
        headers = structure.get('headers', [])
        if headers:
            engine.set_row_data(1, headers, header=True)
        
        rows = structure.get('rows', [])
        for i, row in enumerate(rows):
            engine.set_row_data(i + 2, row)
        
        import re
        formulas = structure.get('formulas', {})
        for cell_ref, formula in formulas.items():
            match = re.match(r'([A-Z]+)(\d+)', cell_ref.upper())
            if match:
                col = sum((ord(c) - ord('A') + 1) * (26 ** i) for i, c in enumerate(reversed(match.group(1))))
                row = int(match.group(2))
                engine.set_formula(row, col, formula)
        
        engine.auto_fit_columns()
        if headers and rows:
            engine.add_borders(1, 1, len(rows) + 1, len(headers))
        
        filepath = os.path.join(OUTPUT_DIR, f"{doc_id}.xlsx")
        engine.save(filepath)
        return filepath

class PPTGenerationTool(BaseTool):
    """Tool for generating PowerPoint presentations."""
    name = "generate_presentation"
    description = "Generates a PowerPoint presentation based on a user prompt."

    async def run(
        self, 
        prompt: str, 
        title: str = "Generated Presentation", 
        api_config: Optional[Dict[str, Any]] = None
    ) -> ToolResult:
        try:
            doc_id = str(uuid.uuid4())
            
            # 1. Generate Structure
            structure = await llm_service.generate_document_structure(
                user_prompt=prompt,
                doc_type='ppt',
                config=api_config
            )
            
            # 2. Generate File
            filepath = await self._generate_file(doc_id, structure, title)
            
            return ToolResult(
                success=True,
                data={
                    "file_path": filepath,
                    "file_name": os.path.basename(filepath),
                    "file_url": f"/api/download/{os.path.basename(filepath)}",
                    "title": structure.get('title', title),
                    "structure": structure
                },
                message=f"Successfully generated Presentation: {structure.get('title', title)}",
                artifacts=[filepath]
            )

        except Exception as e:
            logger.error(f"PPT generation failed: {e}", exc_info=True)
            return ToolResult(success=False, error=str(e))

    async def _generate_file(self, doc_id: str, structure: dict, fallback_title: str) -> str:
        engine = PPTEngine()
        
        title = structure.get('title', fallback_title)
        subtitle = structure.get('subtitle', 'Generated by AI Office Suite')
        
        engine.add_title_slide(title, subtitle)
        
        for slide_data in structure.get('slides', [])[1:]:
            slide_title = slide_data.get('title', 'Slide')
            content = slide_data.get('content', [])
            
            if slide_data.get('type') == 'title':
                engine.add_title_slide(slide_title, content[0] if content else '')
            else:
                engine.add_content_slide(slide_title, content if isinstance(content, list) else [content])
        
        filepath = os.path.join(OUTPUT_DIR, f"{doc_id}.pptx")
        engine.save(filepath)
        return filepath

# Instantiate registry or instances if needed
word_tool = WordGenerationTool()
excel_tool = ExcelGenerationTool()
ppt_tool = PPTGenerationTool()
