from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Index, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.database import Base


class ParseJob(Base):
    __tablename__ = "parse_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    resume_id = Column(
        UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False
    )
    status = Column(Text, nullable=False, default="pending")
    parser_used = Column(Text, nullable=True)
    raw_text = Column(Text, nullable=True)
    parsed_data = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<ParseJob id={self.id} status={self.status!r}>"


Index("ix_parse_jobs_resume_id", ParseJob.resume_id)
Index("ix_parse_jobs_status", ParseJob.status)
