from fastapi import APIRouter, Depends, Query
from uuid import UUID
from typing import Optional

from app.dependencies import get_current_user, get_candidate_service
from app.services.candidate_service import CandidateService
from app.schemas.candidate import (
    CandidateFilters, CandidateUpdate,
    CandidateResponse, CandidateListItem
)
from app.models.user import User
from app.services.file_service import build_file_response
from app.config import settings

router = APIRouter(prefix="/api/v1", tags=["candidates"])


@router.get("/candidates")
async def list_candidates(
    search: Optional[str] = Query(None),
    skills: Optional[str] = Query(None, description="Comma-separated: Python,React"),
    location: Optional[str] = Query(None),
    experience_min: Optional[float] = Query(None, ge=0),
    experience_max: Optional[float] = Query(None, le=50),
    notice_period: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: CandidateService = Depends(get_candidate_service),
    current_user: User = Depends(get_current_user),
):
    skills_list = [s.strip() for s in skills.split(",")] if skills else None
    filters = CandidateFilters(
        search=search, skills=skills_list, location=location,
        experience_min=experience_min, experience_max=experience_max,
        notice_period=notice_period, source=source,
    )
    result = await service.list_candidates(filters, page, page_size)
    result["items"] = [CandidateListItem.model_validate(c) for c in result["items"]]
    return {"success": True, "data": result}


@router.get("/candidates/{candidate_id}")
async def get_candidate(
    candidate_id: UUID,
    service: CandidateService = Depends(get_candidate_service),
    current_user: User = Depends(get_current_user),
):
    candidate = await service.get_candidate(candidate_id)
    return {"success": True, "data": CandidateResponse.model_validate(candidate)}


@router.patch("/candidates/{candidate_id}")
async def update_candidate(
    candidate_id: UUID,
    data: CandidateUpdate,
    service: CandidateService = Depends(get_candidate_service),
    current_user: User = Depends(get_current_user),
):
    candidate = await service.update_candidate(candidate_id, data)
    return {"success": True, "data": CandidateResponse.model_validate(candidate)}


@router.delete("/candidates/{candidate_id}")
async def deactivate_candidate(
    candidate_id: UUID,
    service: CandidateService = Depends(get_candidate_service),
    current_user: User = Depends(get_current_user),
):
    await service.deactivate_candidate(candidate_id)
    return {"success": True, "message": "Candidate deactivated"}


@router.get("/candidates/{candidate_id}/resume")
async def download_resume(
    candidate_id: UUID,
    service: CandidateService = Depends(get_candidate_service),
    current_user: User = Depends(get_current_user),
):
    candidate = await service.get_candidate(candidate_id)
    if not candidate.resumes:
        from fastapi import HTTPException
        raise HTTPException(404, "No resume found for this candidate")
    latest = sorted(candidate.resumes, key=lambda r: r.uploaded_at, reverse=True)[0]
    return build_file_response(latest.file_path, latest.original_filename, settings.upload_dir)