from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, Any


class ImportBatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    original_filename: str
    total_rows: int
    successful_rows: int
    duplicate_rows: int
    error_rows: int
    status: str
    error_log: Optional[list[dict]] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class ImportUploadResponse(BaseModel):
    import_batch_id: UUID
    status: str = "pending"
    message: str = "Import started in background."
