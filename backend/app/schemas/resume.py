from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class ResumeUploadResponse(BaseModel):
    resume_id: UUID
    parse_job_id: UUID
    status: str = "pending"
    message: str = "Resume uploaded. Parsing started in background."

class ParseJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    resume_id: UUID
    status: str           # pending | processing | completed | failed
    parser_used: Optional[str] = None
    error_message: Optional[str] = None
    parsed_data: Optional[dict] = None
    candidate_id: Optional[UUID] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None