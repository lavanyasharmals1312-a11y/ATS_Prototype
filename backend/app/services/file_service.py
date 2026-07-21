import os
import uuid
import aiofiles
from datetime import datetime, timezone
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from loguru import logger

# Constants
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAGIC_BYTES = {
    "application/pdf": b"%PDF",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": b"PK\x03\x04",
}

MIME_TO_EXT = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}

async def validate_file(file: UploadFile, max_size_mb: int) -> None:
    """
    Validate the uploaded file.
    Raises HTTPException(400) if validation fails.
    """
    # 1. Extension check
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a filename",
        )
    filename_lower = file.filename.lower()
    if not (filename_lower.endswith(".pdf") or filename_lower.endswith(".docx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are accepted",
        )

    # 2. Magic bytes check
    # Read first 4 bytes
    header = await file.read(4)
    await file.seek(0)  # Critical: reset file pointer

    # Determine expected mime type from extension
    ext = filename_lower.split('.')[-1]
    expected_mime = None
    if ext == "pdf":
        expected_mime = "application/pdf"
    elif ext == "docx":
        expected_mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        # This should not happen due to extension check, but for safety
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file extension",
        )

    expected_header = MAGIC_BYTES.get(expected_mime)
    if expected_header is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error: unsupported mime type",
        )

    if header != expected_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match its extension",
        )

    # 3. Size check — read content, measure, reset
    content = await file.read()
    await file.seek(0)
    if len(content) > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {max_size_mb}MB limit",
        )

async def store_file(file: UploadFile, upload_dir: str) -> Tuple[str, str, str]:
    """
    Store the uploaded file.
    Returns (stored_filename, relative_path, mime_type).
    """
    # Determine mime type from extension (we already validated)
    filename_lower = file.filename.lower()
    ext = filename_lower.split('.')[-1]
    if ext == "pdf":
        mime_type = "application/pdf"
    elif ext == "docx":
        mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        # This should not happen due to validation, but for safety
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file extension",
        )

    # Read the file content
    content = await file.read()
    await file.seek(0)  # reset for any further use

    size = len(content)

    # Generate stored filename
    stored_filename = f"{uuid.uuid4().hex}.{ext}"

    # Create year/month subdirectories
    now = datetime.now(timezone.utc)
    year_month = now.strftime("%Y/%m")
    upload_path = Path(upload_dir) / year_month
    upload_path.mkdir(parents=True, exist_ok=True)

    # Build relative and absolute paths
    relative_path = str(Path(year_month) / stored_filename)
    absolute_path = upload_path / stored_filename

    # Write the file
    async with aiofiles.open(absolute_path, 'wb') as f:
        await f.write(content)

    # Log storage info
    logger.info(f"Stored file: {relative_path} ({size} bytes)")

    return stored_filename, relative_path, mime_type

def get_absolute_path(relative_path: str, upload_dir: str) -> Path:
    """
    Get absolute path from relative path and upload directory.
    Raises HTTPException(404) if file does not exist.
    """
    absolute_path = Path(upload_dir) / relative_path
    if not absolute_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    return absolute_path

def build_file_response(relative_path: str, original_filename: str, upload_dir: str):
    """
    Build a FileResponse for downloading the stored file.
    """
    from fastapi.responses import FileResponse
    absolute_path = get_absolute_path(relative_path, upload_dir)
    return FileResponse(
        path=str(absolute_path),
        filename=original_filename,    # user sees original name on download
        media_type="application/octet-stream",
    )