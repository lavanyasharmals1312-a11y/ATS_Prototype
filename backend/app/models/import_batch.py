from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.database import Base


class ImportBatch(Base):
    __tablename__ = "import_batches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    original_filename = Column(Text, nullable=False)
    stored_path = Column(Text, nullable=True)
    total_rows = Column(Integer, nullable=True, default=0)
    successful_rows = Column(Integer, nullable=True, default=0)
    duplicate_rows = Column(Integer, nullable=True, default=0)
    error_rows = Column(Integer, nullable=True, default=0)
    status = Column(Text, nullable=True, default="pending")
    error_log = Column(JSONB, nullable=True)
    imported_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<ImportBatch id={self.id} status={self.status!r}>"
