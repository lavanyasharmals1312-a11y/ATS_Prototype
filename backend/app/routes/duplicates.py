from fastapi import APIRouter, Depends, Query, BackgroundTasks
from uuid import UUID
from typing import Optional

from app.dependencies import get_current_user, get_duplicate_service, get_db
from app.services.duplicate_service import DuplicateService
from app.schemas.duplicate import DuplicatePairResponse, ResolveFlagRequest
from app.schemas.candidate import CandidateListItem
from app.models.user import User

router = APIRouter(prefix="/api/v1/duplicates", tags=["duplicates"])


@router.get("")
async def list_duplicate_flags(
    status: Optional[str] = Query(None, pattern="^(pending|confirmed|dismissed)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: DuplicateService = Depends(get_duplicate_service),
    current_user: User = Depends(get_current_user),
):
    result = await service.list_flags(status, page, page_size)
    result["items"] = [
        DuplicatePairResponse(
            id=f.id,
            candidate_a=CandidateListItem.model_validate(f.candidate_a_rel),
            candidate_b=CandidateListItem.model_validate(f.candidate_b_rel),
            reason=f.reason,
            confidence=float(f.confidence),
            status=f.status,
            reviewed_by=f.reviewed_by,
            reviewed_at=f.reviewed_at,
            created_at=f.created_at,
        )
        for f in result["items"]
    ]
    return {"success": True, "data": result}


@router.patch("/{flag_id}")
async def resolve_flag(
    flag_id: UUID,
    body: ResolveFlagRequest,
    service: DuplicateService = Depends(get_duplicate_service),
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    flag = await service.resolve_flag(flag_id, body.status, current_user.id, db)
    return {"success": True, "data": {"id": str(flag.id), "status": flag.status}}


@router.post("/scan")
async def trigger_duplicate_scan(
    background_tasks: BackgroundTasks,
    service: DuplicateService = Depends(get_duplicate_service),
    current_user: User = Depends(get_current_user),
):
    service.trigger_scan(background_tasks)
    return {"success": True, "message": "Duplicate scan started in background"}