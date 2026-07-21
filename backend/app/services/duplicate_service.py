import math
import logging
from uuid import UUID
from fastapi import HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.duplicate_repository import DuplicateFlagRepository
from app.models.duplicate_flag import DuplicateFlag
from app.models.candidate import Candidate
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)


class DuplicateService:

    def __init__(self, repo: DuplicateFlagRepository):
        self.repo = repo

    async def list_flags(
        self, status: str | None, page: int, page_size: int
    ) -> dict:
        items, total = await self.repo.list(status, page, page_size)
        pages = math.ceil(total / page_size) if total > 0 else 0
        return {"items": items, "total": total,
                "page": page, "pages": pages, "page_size": page_size}

    async def get_flag(self, flag_id: UUID) -> DuplicateFlag:
        flag = await self.repo.get_by_id(flag_id)
        if not flag:
            raise HTTPException(404, "Duplicate flag not found")
        return flag

    async def resolve_flag(
        self, flag_id: UUID, status: str, reviewer_id: UUID, db: AsyncSession
    ) -> DuplicateFlag:
        flag = await self.get_flag(flag_id)
        if flag.status != "pending":
            raise HTTPException(400, f"Flag already {flag.status}")

        flag = await self.repo.resolve(flag, status, reviewer_id)

        if status == "confirmed":
            await self._apply_confirmation(flag, db)

        return flag

    async def _apply_confirmation(
        self, flag: DuplicateFlag, db: AsyncSession
    ) -> None:
        """
        On confirmation:
        - candidate_b is marked as confirmed_duplicate
        - candidate_b.canonical_id points to candidate_a (the master)
        candidate_a is kept as the clean record.
        """
        result = await db.execute(
            select(Candidate).where(Candidate.id == flag.candidate_id_b)
        )
        candidate_b = result.scalar_one_or_none()
        if candidate_b:
            candidate_b.duplicate_status = "confirmed_duplicate"
            candidate_b.canonical_id = flag.candidate_id_a
            await db.commit()

    def trigger_scan(self, background_tasks: BackgroundTasks) -> None:
        async def _scan_task() -> None:
            from app.services.duplicate_detector import run_full_scan
            async with AsyncSessionLocal() as db:
                count = await run_full_scan(db)
                logger.info(f"Background scan done: {count} new flags")
        background_tasks.add_task(_scan_task)