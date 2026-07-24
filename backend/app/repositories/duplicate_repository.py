from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.duplicate_flag import DuplicateFlag


class DuplicateFlagRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(
        self,
        status: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[DuplicateFlag], int]:
        stmt = (
            select(DuplicateFlag)
            .options(
                selectinload(DuplicateFlag.candidate_a_rel),
                selectinload(DuplicateFlag.candidate_b_rel),
            )
        )
        if status:
            stmt = stmt.where(DuplicateFlag.status == status)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.scalar(count_stmt) or 0

        items_stmt = (
            stmt.order_by(DuplicateFlag.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(items_stmt)
        return list(result.scalars().all()), total

    async def get_by_id(self, flag_id: UUID) -> DuplicateFlag | None:
        result = await self.db.execute(
            select(DuplicateFlag)
            .options(
                selectinload(DuplicateFlag.candidate_a_rel),
                selectinload(DuplicateFlag.candidate_b_rel),
            )
            .where(DuplicateFlag.id == flag_id)
        )
        return result.scalar_one_or_none()

    async def resolve(
        self,
        flag: DuplicateFlag,
        status: str,
        reviewer_id: UUID,
    ) -> DuplicateFlag:
        flag.status = status
        flag.reviewed_by = reviewer_id
        flag.reviewed_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(flag)
        return flag