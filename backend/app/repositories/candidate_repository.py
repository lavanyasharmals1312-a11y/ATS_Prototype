from typing import Protocol, runtime_checkable
from sqlalchemy import Select, func, cast, text, select
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import Text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import datetime, timezone

from app.models.candidate import Candidate
from app.models.resume import Resume
from app.models.duplicate_flag import DuplicateFlag
from app.models.parse_job import ParseJob


@runtime_checkable
class FilterSpec(Protocol):
    def apply(self, stmt: Select) -> Select: ...


class ActiveOnlySpec:
    """Always included. Excludes soft-deleted candidates."""
    def apply(self, stmt: Select) -> Select:
        return stmt.where(Candidate.is_active == True)


class SearchSpec:
    """
    PostgreSQL full-text search on name + company + skills.
    Falls back to email/phone ILIKE for contact-info searches.
    """
    def __init__(self, term: str):
        self.term = term

    def apply(self, stmt: Select) -> Select:
        fts_vector = func.to_tsvector(
            "english",
            func.coalesce(Candidate.candidate_name, "")
            + " "
            + func.coalesce(Candidate.current_company, "")
            + " "
            + func.array_to_string(
                func.coalesce(Candidate.skills, cast([], ARRAY(Text))), " "
            ),
        )
        tsquery = func.plainto_tsquery("english", self.term)
        return stmt.where(
            fts_vector.op("@@")(tsquery)
            | Candidate.candidate_email.ilike(f"%{self.term}%")
            | Candidate.candidate_phone.contains(self.term)
        )


class SkillsSpec:
    """
    PostgreSQL array overlap operator (&&).
    Matches candidates who have ANY of the requested skills.
    """
    def __init__(self, skills: list[str]):
        self.skills = skills

    def apply(self, stmt: Select) -> Select:
        return stmt.where(
            Candidate.skills.overlap(cast(self.skills, ARRAY(Text)))
        )


class LocationSpec:
    def __init__(self, location: str):
        self.location = location

    def apply(self, stmt: Select) -> Select:
        return stmt.where(
            Candidate.current_location.ilike(f"%{self.location}%")
        )


class ExperienceRangeSpec:
    def __init__(self, min_years: float | None, max_years: float | None):
        self.min = min_years
        self.max = max_years

    def apply(self, stmt: Select) -> Select:
        if self.min is not None:
            stmt = stmt.where(Candidate.experience_years >= self.min)
        if self.max is not None:
            stmt = stmt.where(Candidate.experience_years <= self.max)
        return stmt


class NoticePeriodSpec:
    def __init__(self, notice: str):
        self.notice = notice

    def apply(self, stmt: Select) -> Select:
        return stmt.where(
            Candidate.notice_period.ilike(f"%{self.notice}%")
        )


class SourceSpec:
    def __init__(self, source: str):
        self.source = source

    def apply(self, stmt: Select) -> Select:
        return stmt.where(Candidate.source == self.source)


class CandidateRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: UUID) -> Candidate | None:
        result = await self.db.execute(
            select(Candidate)
            .options(selectinload(Candidate.resumes))
            .where(Candidate.id == id)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        specs: list[FilterSpec],
        page: int,
        page_size: int,
    ) -> tuple[list[Candidate], int]:
        base = select(Candidate)
        for spec in specs:
            base = spec.apply(base)

        count_stmt = select(func.count()).select_from(base.subquery())
        total = await self.db.scalar(count_stmt) or 0

        items_stmt = (
            base.order_by(Candidate.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(items_stmt)
        return list(result.scalars().all()), total

    async def update(
        self, candidate: Candidate, data: dict
    ) -> Candidate:
        for field, value in data.items():
            setattr(candidate, field, value)
        await self.db.commit()
        await self.db.refresh(candidate)
        return candidate

    async def deactivate(self, candidate: Candidate) -> None:
        candidate.is_active = False
        await self.db.commit()

    async def get_stats(self) -> dict:
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        candidate_stats = await self.db.execute(
            select(
                func.count().filter(Candidate.is_active == True)
                    .label("total"),
                func.count().filter(
                    Candidate.is_active == True,
                    Candidate.created_at >= month_start
                ).label("this_month"),
            )
        )
        row = candidate_stats.one()

        pending_dups = await self.db.scalar(
            select(func.count(DuplicateFlag.id))
            .where(DuplicateFlag.status == "pending")
        ) or 0

        resumes_count = await self.db.scalar(
            select(func.count(Resume.id))
        ) or 0

        failed_jobs = await self.db.scalar(
            select(func.count(ParseJob.id))
            .where(ParseJob.status == "failed")
        ) or 0

        skills_result = await self.db.execute(
            text("""
                SELECT COUNT(DISTINCT skill)
                FROM candidates, unnest(skills) AS skill
                WHERE is_active = TRUE
            """)
        )
        skills_count = skills_result.scalar() or 0

        return {
            "total_candidates": row.total,
            "candidates_this_month": row.this_month,
            "pending_duplicates": pending_dups,
            "resumes_uploaded": resumes_count,
            "failed_parse_jobs": failed_jobs,
            "skills_indexed": skills_count,
        }