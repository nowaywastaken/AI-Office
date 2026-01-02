import os
import json
import re
import logging
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

# Configure logging
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
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(
                    api_key=self.api_key,
                    base_url="https://openrouter.ai/api/v1",
                    default_headers={
                        "HTTP-Referer": "http://localhost:5173",
                        "X-Title": "AI Office Suite"
                    }
                )
            except ImportError:
                logger.error("OpenAI package not installed. Please install it using: pip install openai")
                raise ImportError("OpenAI package missing")

        else:
            logger.warning("No API key found. AI features will fail until OPENROUTER_API_KEY is set in .env")
    
    async def detect_document_type(
        self,
        user_prompt: str,
        config: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Detect the optimal document type based on user's prompt.
        
        Returns: 'word', 'excel', or 'ppt'
        """
        client = self._get_client(config)
        model = self._get_model(config)
        
        system_prompt = """You are a document type classifier. Based on the user's request, determine the most appropriate document type.

Rules:
- "word": For text-heavy documents like reports, letters, essays, meeting notes, proposals, contracts, articles
- "excel": For data, numbers, calculations, budgets, lists, tables, schedules, tracking, inventory
- "ppt": For presentations, slides, pitch decks, training materials, visual storytelling

Respond with ONLY a JSON object: {"type": "word"} or {"type": "excel"} or {"type": "ppt"}
No other text."""

        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            result = json.loads(content)
            detected_type = result.get("type")
            
            if detected_type in ["word", "excel", "ppt"]:
                return detected_type
            
            # If JSON parsing worked but value is unexpected, default to word but log warning
            logger.warning(f"Unexpected document type detected: {detected_type}, defaulting to word")
            return "word"
            
        except Exception as e:
            logger.error(f"Document type detection failed: {str(e)}")
            raise Exception(f"AI Detection failed: {str(e)}. Please check your API key.")

    
    async def generate_document_structure(
        self,
        user_prompt: str,
        doc_type: str,
        style_guide: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
        context: Optional[List[Dict[str, str]]] = None # Context for modifications
    ) -> Dict[str, Any]:
        """
        Generate structured document content from natural language.
        """
        client = await self._get_client(config)
        model = self._get_model(config)
        
        if doc_type == 'word':
            return await self._generate_word_structure(user_prompt, style_guide, client, model, context)
        elif doc_type == 'excel':
            return await self._generate_excel_structure(user_prompt, client, model, context)
        elif doc_type == 'ppt':
            return await self._generate_ppt_structure(user_prompt, client, model, context)
        else:
            raise ValueError(f"Unknown document type: {doc_type}")

    async def generate_document_structure_stream(
        self,
        user_prompt: str,
        doc_type: str,
        style_guide: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
        context: Optional[List[Dict[str, str]]] = None
    ):
        """
        Stream Markdown-formatted content for real-time preview, 
        while eventually yielding the final JSON structure for the document engine.
        """
        client = await self._get_client(config)
        model = self._get_model(config)

        # Decide which prompt to use based on type
        if doc_type == 'word':
            system_prompt = """You are a professional document writer. Your goal is to write a high-quality document.
            
            IMPORTANT: Output in TWO parts:
            1. First, output the document content directly in MARKDOWN format. This is for real-time preview.
            2. Finally, output a JSON block at the very end wrapped in <STRUCTURE> tags.
            
            JSON Structure: {
                "title": "Document Title",
                "sections": [{"heading": "...", "content": "...", "level": 1}],
                "style_guide": {...}
            }
            
            The Markdown should be rich and detailed. The JSON must match the content.
            """
        elif doc_type == 'excel':
            system_prompt = """You are a data analyst. 
            1. First, output a Markdown TABLE representing the data.
            2. Finally, output a JSON block wrapped in <STRUCTURE> tags.
            
            JSON Structure: {
                "title": "Sheet Name",
                "headers": ["Col1", "Col2"],
                "rows": [["Val1", "Val2"]],
                "formulas": {"A1": "=SUM(...)"}
            }
            """
        else: # PPT
            system_prompt = """You are a presentation designer.
            1. First, output a Markdown list of slides with their titles and main points.
            2. Finally, output a JSON block wrapped in <STRUCTURE> tags.
            
            JSON Structure: {
                "title": "Presentation Title",
                "slides": [{"type": "content", "title": "Slide Title", "content": ["point 1"]}]
            }
            """

        full_messages = [{"role": "system", "content": system_prompt}]
        if context:
            full_messages.extend(context)
        full_messages.append({"role": "user", "content": user_prompt})

        try:
            response = await client.chat.completions.create(
                model=model,
                messages=full_messages,
                stream=True
            )
            
            async for chunk in response:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
                    
        except Exception as e:
            logger.error(f"Structure stream failed: {str(e)}")
            yield f"Error: {str(e)}"
    
    async def _generate_word_structure(
        self,
        user_prompt: str,
        style_guide: Optional[str] = None,
        client: Any = None,
        model: str = None,
        context: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Generate Word document structure."""
        
        system_prompt = """You are a professional document writer. Generate a structured document.
        If context is provided, you are modifying an existing document.
        Output a JSON object with: title, sections, style_guide.
        Respond ONLY with valid JSON."""

        try:
            messages = [{"role": "system", "content": system_prompt}]
            if context: messages.extend(context)
            messages.append({"role": "user", "content": user_prompt})
            
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"LLM generation failed: {str(e)}")
            raise Exception(f"Failed to generate Word document: {str(e)}")

    
    async def _generate_excel_structure(self, user_prompt: str, client: Any = None, model: str = None, context: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """Generate Excel spreadsheet structure."""
        
        system_prompt = """You are a data analyst. Generate structured spreadsheet data.
        If context is provided, you are modifying an existing sheet.
        Output a JSON object with: title, headers, rows, formulas.
        Respond ONLY with valid JSON."""

        try:
            messages = [{"role": "system", "content": system_prompt}]
            if context: messages.extend(context)
            messages.append({"role": "user", "content": user_prompt})

            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"LLM generation failed: {str(e)}")
            raise Exception(f"Failed to generate Excel spreadsheet: {str(e)}")

    
    async def _generate_ppt_structure(self, user_prompt: str, client: Any = None, model: str = None, context: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """Generate PowerPoint presentation structure."""
        
        system_prompt = """You are a presentation designer. Generate a structured presentation.
        If context is provided, you are modifying an existing presentation.
        Output a JSON object with: title, subtitle, slides.
        Respond ONLY with valid JSON."""

        try:
            messages = [{"role": "system", "content": system_prompt}]
            if context: messages.extend(context)
            messages.append({"role": "user", "content": user_prompt})

            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"LLM generation failed: {str(e)}")
            raise Exception(f"Failed to generate Presentation: {str(e)}")

    async def chat(
        self,
        messages: List[Dict[str, str]],
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Have a conversation with the user to clarify document requirements.
        
        Returns:
            - message: AI's response text
            - ready_to_generate: True if AI thinks requirements are clear
            - detected_type: Detected document type if ready
            - summary: Summary of requirements if ready
        """
        client = await self._get_client(config)
        model = self._get_model(config)
        
        system_prompt = """你是一个专业的文档助手。你的任务是帮助用户创建文档（Word、Excel 或 PPT）。

在开始创建文档之前，你需要：
1. 理解用户想要什么类型的文档
2. 了解文档的主要内容 and 结构
3. 确认任何特殊的格式或样式要求

与用户对话时：
- 用简洁友好的方式回复
- 如果需求不清楚，提出具体问题
- 当你认为已经充分了解需求时，在回复末尾添加标记 [READY]

回复格式（JSON）：
{
    "message": "你的回复内容",
    "ready_to_generate": true/false,
    "detected_type": "word/excel/ppt" (仅当 ready_to_generate 为 true 时),
    "summary": "需求摘要" (仅当 ready_to_generate 为 true 时)
}

始终用中文回复，除非用户用其他语言交流。"""

        try:
            full_messages = [{"role": "system", "content": system_prompt}] + messages
            
            response = await client.chat.completions.create(
                model=model,
                messages=full_messages,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return {
                "message": result.get("message", ""),
                "ready_to_generate": result.get("ready_to_generate", False),
                "detected_type": result.get("detected_type"),
                "summary": result.get("summary")
            }
            
        except Exception as e:
            logger.error(f"Chat failed: {str(e)}")
            raise Exception(f"Chat failed: {str(e)}")

    async def chat_stream(
        self,
        messages: List[Dict[str, str]],
        config: Optional[Dict[str, Any]] = None
    ):
        """
        Streamed conversation with the AI.
        """
        client = await self._get_client(config)
        model = self._get_model(config)
        
        system_prompt = """你是一个专业的文档助手。你的任务是帮助用户创建文档（Word、Excel 或 PPT）。
请直接输出你的回复内容。如果你认为需求已经明确且准备好生成文档，请在回复的最末尾另起一行加上 [READY:type:summary]。
其中 type 是 word/excel/ppt，summary 是需求简要描述。

示例：
好的，我已经了解了您的需求，将为您创建一份关于“公司年度总结”的报告。
[READY:word:公司年度总结报告]

始终用中文回复，除非用户用其他语言交流。"""

        try:
            full_messages = [{"role": "system", "content": system_prompt}] + messages
            
            response = await client.chat.completions.create(
                model=model,
                messages=full_messages,
                stream=True
            )
            
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"Chat stream failed: {str(e)}")
            yield f"Error: {str(e)}"



    async def _get_client(self, config: Optional[Dict[str, Any]] = None):
        """Helper to get the appropriate client."""
        if config:
            api_key = config.get("api_key")
            if api_key:
                try:
                    from openai import AsyncOpenAI
                    return AsyncOpenAI(
                        api_key=api_key,
                        base_url=config.get("base_url") or "https://openrouter.ai/api/v1",
                        default_headers={
                            "HTTP-Referer": "http://localhost:5173",
                            "X-Title": "AI Office Suite"
                        }
                    )
                except ImportError:
                    pass
        
        if not self.client:
             raise ValueError("API Key not found. Please set OPENROUTER_API_KEY in .env or provide it in the request.")
        return self.client


    def _get_model(self, config: Optional[Dict[str, Any]] = None):
        if config and config.get("model"):
            return config.get("model")
        return self.model

# Global instance
llm_service = LLMService()


