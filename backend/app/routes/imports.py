from fastapi import APIRouter, Depends, File, UploadFile, Query, BackgroundTasks
from uuid import UUID
from loguru import logger

from app.dependencies import get_current_user, get_import_service
from app.services.import_service import ImportService
from app.schemas.import_batch import ImportBatchResponse, ImportUploadResponse
from app.models.user import User

router = APIRouter(prefix="/api/v1/imports", tags=["imports"])


@router.post("/trackers", status_code=202)
async def upload_tracker(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    service: ImportService = Depends(get_import_service),
    current_user: User = Depends(get_current_user),
) -> ImportUploadResponse:
    batch = await service.upload_and_queue(
        file, current_user.id, background_tasks
    )
    logger.info(
        f"Import batch {batch.id} queued by {current_user.email}"
    )
    return ImportUploadResponse(import_batch_id=batch.id)


@router.get("")
async def list_import_batches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: ImportService = Depends(get_import_service),
    current_user: User = Depends(get_current_user),
):
    result = await service.list_batches(page, page_size)
    result["items"] = [
        ImportBatchResponse.model_validate(b)
        for b in result["items"]
    ]
    return {"success": True, "data": result}


@router.get("/{batch_id}")
async def get_import_batch(
    batch_id: UUID,
    service: ImportService = Depends(get_import_service),
    current_user: User = Depends(get_current_user),
):
    batch = await service.get_batch(batch_id)
    return {
        "success": True,
        "data": ImportBatchResponse.model_validate(batch),
    }
