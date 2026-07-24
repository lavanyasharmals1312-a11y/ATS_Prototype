from pathlib import Path
import pdfplumber
from docx import Document
from loguru import logger

from app.services.protocols import TextExtractor


class ResumeExtractor:
    """Single responsibility: extract raw text from a file path."""

    async def extract(self, path: str, mime_type: str) -> str:
        full_path = Path(path)
        if not full_path.is_absolute():
            from app.config import settings
            full_path = Path(settings.upload_dir) / path

        try:
            if mime_type == "application/pdf":
                return await self._extract_pdf(full_path)
            elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                return await self._extract_docx(full_path)
            else:
                raise ValueError(f"Unsupported mime type: {mime_type}")
        except Exception as e:
            logger.warning(f"Text extraction failed for {path}: {e}")
            return ""

    async def _extract_pdf(self, path: Path) -> str:
        text_parts = []
        with pdfplumber.open(str(path)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
        return "\n".join(text_parts)

    async def _extract_docx(self, path: Path) -> str:
        doc = Document(str(path))
        return "\n".join(p.text for p in doc.paragraphs)