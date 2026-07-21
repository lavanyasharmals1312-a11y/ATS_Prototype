from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.import_batch import ImportBatch


class ImportBatchRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        original_filename: str,
        stored_path: str,
        imported_by: UUID,
    ) -> ImportBatch:
        batch = ImportBatch(
            original_filename=original_filename,
            stored_path=stored_path,
            status="pending",
            imported_by=imported_by,
        )
        self.db.add(batch)
        await self.db.commit()
        await self.db.refresh(batch)
        return batch

    async def get_by_id(self, batch_id: UUID) -> ImportBatch | None:
        result = await self.db.execute(
            select(ImportBatch).where(ImportBatch.id == batch_id)
        )
        return result.scalar_one_or_none()

    async def list(
        self, page: int, page_size: int
    ) -> tuple[list[ImportBatch], int]:
        stmt = (
            select(ImportBatch)
            .order_by(ImportBatch.created_at.desc())
        )
        total = (
            await self.db.scalar(
                select(func.count()).select_from(stmt.subquery())
            )
            or 0
        )
        result = await self.db.execute(
            stmt.offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def set_processing(
        self, batch: ImportBatch, total_rows: int
    ) -> None:
        batch.status = "processing"
        batch.total_rows = total_rows
        await self.db.commit()

    async def increment_success(self, batch: ImportBatch) -> None:
        batch.successful_rows += 1

    async def increment_duplicate(self, batch: ImportBatch) -> None:
        batch.duplicate_rows += 1

    async def increment_error(self, batch: ImportBatch) -> None:
        batch.error_rows += 1

    async def flush_counters(
        self, batch: ImportBatch, error_log: list
    ) -> None:
        batch.error_log = error_log
        await self.db.commit()

    async def set_completed(
        self, batch: ImportBatch, error_log: list
    ) -> None:
        batch.status = "completed"
        batch.completed_at = datetime.now(timezone.utc)
        batch.error_log = error_log
        await self.db.commit()

    async def set_failed(self, batch: ImportBatch, error: str) -> None:
        batch.status = "failed"
        batch.error_log = [{"error": error}]
        await self.db.commit()
