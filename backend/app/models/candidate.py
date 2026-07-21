from uuid import uuid4

from sqlalchemy import (
    ARRAY,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    candidate_name = Column(Text, nullable=True)
    candidate_email = Column(Text, unique=True, nullable=True, index=True)
    candidate_phone = Column(Text, nullable=True, index=True)
    current_designation = Column(Text, nullable=True)
    current_company = Column(Text, nullable=True)
    experience_years = Column(Numeric(4, 1), nullable=True)
    current_location = Column(Text, nullable=True)
    preferred_location = Column(Text, nullable=True)
    notice_period = Column(Text, nullable=True)
    current_ctc = Column(Text, nullable=True)
    expected_ctc = Column(Text, nullable=True)
    highest_qualification = Column(Text, nullable=True)
    university = Column(Text, nullable=True)
    skills = Column(ARRAY(Text), nullable=True)
    tags = Column(ARRAY(Text), nullable=True)
    notes = Column(Text, nullable=True)
    source = Column(Text, nullable=True, default="upload")
    is_active = Column(Boolean, nullable=False, default=True)
    duplicate_status = Column(Text, nullable=True, default="clean")
    canonical_id = Column(
        UUID(as_uuid=True), ForeignKey("candidates.id"), nullable=True
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    resumes = relationship(
        "Resume",
        back_populates="candidate",
        primaryjoin="Candidate.id == Resume.candidate_id",
        lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<Candidate id={self.id} name={self.candidate_name!r}>"


Index(
    "ix_candidates_skills",
    Candidate.skills,
    postgresql_using="gin",
)
Index(
    "ix_candidates_tags",
    Candidate.tags,
    postgresql_using="gin",
)
