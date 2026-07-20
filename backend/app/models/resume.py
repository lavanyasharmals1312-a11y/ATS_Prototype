from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    candidate_id = Column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="SET NULL"),
        nullable=True,
    )
    original_filename = Column(Text, nullable=False)
    stored_filename = Column(Text, nullable=False, unique=True)
    file_path = Column(Text, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(Text, nullable=True)
    is_latest = Column(Boolean, nullable=True, default=True)
    uploaded_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    uploaded_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    def __repr__(self) -> str:
        return f"<Resume id={self.id} stored={self.stored_filename!r}>"
