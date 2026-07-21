from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class DuplicateFlag(Base):
    __tablename__ = "duplicate_flags"
    __table_args__ = (
        UniqueConstraint(
            "candidate_id_a", "candidate_id_b", name="uq_duplicate_pair"
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    candidate_id_a = Column(
        UUID(as_uuid=True), ForeignKey("candidates.id"), nullable=False
    )
    candidate_id_b = Column(
        UUID(as_uuid=True), ForeignKey("candidates.id"), nullable=False
    )
    reason = Column(Text, nullable=False)
    confidence = Column(Numeric(3, 2), nullable=True)
    status = Column(Text, nullable=True, default="pending")
    reviewed_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    candidate_a_rel = relationship(
        "Candidate",
        foreign_keys="DuplicateFlag.candidate_id_a",
        lazy="noload",
    )
    candidate_b_rel = relationship(
        "Candidate",
        foreign_keys="DuplicateFlag.candidate_id_b",
        lazy="noload",
    )
    reviewer_rel = relationship(
        "User",
        foreign_keys="DuplicateFlag.reviewed_by",
        lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<DuplicateFlag id={self.id} reason={self.reason!r}>"


Index("ix_duplicate_flags_status", DuplicateFlag.status)
