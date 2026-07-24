from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, get_candidate_service
from app.services.candidate_service import CandidateService
from app.schemas.stats import StatsResponse
from app.models.user import User

router = APIRouter(prefix="/api/v1", tags=["stats"])


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    service: CandidateService = Depends(get_candidate_service),
    current_user: User = Depends(get_current_user),
):
    stats = await service.get_stats()
    return stats