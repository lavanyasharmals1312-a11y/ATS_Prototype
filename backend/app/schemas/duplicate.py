from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, Literal
from app.schemas.candidate import CandidateListItem

class DuplicatePairResponse(BaseModel):
    """
    Embeds both candidate objects so frontend can show
    side-by-side comparison without extra API calls.
    """
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    candidate_a: CandidateListItem
    candidate_b: CandidateListItem
    reason: str           # "email" | "phone" | "name_company"
    confidence: float     # 1.00 | 0.95 | 0.70
    status: str           # "pending" | "confirmed" | "dismissed"
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

class ResolveFlagRequest(BaseModel):
    status: Literal["confirmed", "dismissed"]