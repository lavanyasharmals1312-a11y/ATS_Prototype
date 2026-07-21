import math
from uuid import UUID
from fastapi import HTTPException

from app.repositories.candidate_repository import (
    CandidateRepository,
    FilterSpec,
    ActiveOnlySpec, SearchSpec, SkillsSpec,
    LocationSpec, ExperienceRangeSpec,
    NoticePeriodSpec, SourceSpec,
)
from app.schemas.candidate import CandidateFilters, CandidateUpdate
from app.models.candidate import Candidate


def build_specs(filters: CandidateFilters) -> list[FilterSpec]:
    specs: list[FilterSpec] = [ActiveOnlySpec()]
    if filters.search:
        specs.append(SearchSpec(filters.search))
    if filters.skills:
        specs.append(SkillsSpec(filters.skills))
    if filters.location:
        specs.append(LocationSpec(filters.location))
    if filters.experience_min is not None or filters.experience_max is not None:
        specs.append(
            ExperienceRangeSpec(filters.experience_min, filters.experience_max)
        )
    if filters.notice_period:
        specs.append(NoticePeriodSpec(filters.notice_period))
    if filters.source:
        specs.append(SourceSpec(filters.source))
    return specs


class CandidateService:

    def __init__(self, repo: CandidateRepository):
        self.repo = repo

    async def list_candidates(
        self,
        filters: CandidateFilters,
        page: int,
        page_size: int,
    ) -> dict:
        specs = build_specs(filters)
        items, total = await self.repo.list(specs, page, page_size)
        pages = math.ceil(total / page_size) if total > 0 else 0
        return {
            "items": items,
            "total": total,
            "page": page,
            "pages": pages,
            "page_size": page_size,
        }

    async def get_candidate(self, id: UUID) -> Candidate:
        candidate = await self.repo.get_by_id(id)
        if not candidate or not candidate.is_active:
            raise HTTPException(404, "Candidate not found")
        return candidate

    async def update_candidate(
        self, id: UUID, data: CandidateUpdate
    ) -> Candidate:
        candidate = await self.get_candidate(id)
        update_data = data.model_dump(exclude_unset=True)
        return await self.repo.update(candidate, update_data)

    async def deactivate_candidate(self, id: UUID) -> None:
        candidate = await self.get_candidate(id)
        await self.repo.deactivate(candidate)

    async def get_stats(self) -> dict:
        return await self.repo.get_stats()