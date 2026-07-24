from typing import Protocol, runtime_checkable


@runtime_checkable
class ResumeParser(Protocol):
    """
    Any resume parser must implement exactly this.
    Returns a candidate dict or {} on failure. Never raises.
    """

    async def parse(self, text: str) -> dict: ...


@runtime_checkable
class TextExtractor(Protocol):
    """
    Any text extractor must implement exactly this.
    Returns extracted text or "" on failure. Never raises.
    """

    async def extract(self, path: str, mime_type: str) -> str: ...
