import math
from uuid import UUID, uuid4
from pathlib import Path
from datetime import datetime, timezone

from fastapi import UploadFile, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.import_repository import ImportBatchRepository
from app.models.import_batch import ImportBatch
from app.config import settings
from app.database import AsyncSessionLocal
from loguru import logger


ALLOWED_EXTENSIONS = {".xlsx", ".xls", ".csv"}


class ImportService:

    def __init__(self, repo: ImportBatchRepository):
        self.repo = repo

    async def upload_and_queue(
        self,
        file: UploadFile,
        imported_by: UUID,
        background_tasks: BackgroundTasks,
    ) -> ImportBatch:
        stored_path = await self._store_import_file(file)
        batch = await self.repo.create(
            original_filename=file.filename,
            stored_path=stored_path,
            imported_by=imported_by,
        )
        background_tasks.add_task(
            _run_import_background, str(batch.id)
        )
        return batch

    async def list_batches(
        self, page: int, page_size: int
    ) -> dict:
        items, total = await self.repo.list(page, page_size)
        pages = math.ceil(total / page_size) if total > 0 else 0
        return {
            "items": items, "total": total,
            "page": page, "pages": pages,
            "page_size": page_size,
        }

    async def get_batch(self, batch_id: UUID) -> ImportBatch:
        batch = await self.repo.get_by_id(batch_id)
        if not batch:
            raise HTTPException(404, "Import batch not found")
        return batch

    async def _store_import_file(self, file: UploadFile) -> str:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                400, "Only .xlsx, .xls, .csv files accepted"
            )
        now = datetime.now(timezone.utc)
        subdir = (
            Path(settings.upload_dir)
            / "imports"
            / str(now.year)
            / f"{now.month:02d}"
        )
        subdir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid4().hex}{ext}"
        dest = subdir / filename
        content = await file.read()
        dest.write_bytes(content)
        return str(dest)


async def _run_import_background(batch_id_str: str) -> None:
    from uuid import UUID
    from app.services.tracker_import_pipeline import (
        process_import_batch,
    )
    batch_id = UUID(batch_id_str)
    async with AsyncSessionLocal() as db:
        from app.repositories.import_repository import (
            ImportBatchRepository,
        )
        repo = ImportBatchRepository(db)
        batch = await repo.get_by_id(batch_id)
        if not batch:
            logger.error(
                f"Import batch {batch_id} not found in "
                f"background task"
            )
            return
        await process_import_batch(batch, db)
