from fastapi import APIRouter, Depends, File, UploadFile, BackgroundTasks, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging

from app.config import settings
from app.models import User, Candidate, Resume, ParseJob
from app.dependencies import get_db
from app.schemas.resume import ResumeUploadResponse, ParseJobResponse
from app.services.file_service import validate_file, store_file, build_file_response
from app.services.parse_pipeline import process as process_parse_job
from app.routes.auth import get_current_user
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["resumes"])


async def _process_resume(parse_job_id: str) -> None:
    async with AsyncSessionLocal() as db:
        await process_parse_job(parse_job_id, db)


@router.post("/resumes/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResumeUploadResponse:
    await validate_file(file, settings.max_file_size_mb)

    stored_filename, relative_path, mime_type = await store_file(file, settings.upload_dir)

    content = await file.read()
    await file.seek(0)
    file_size = len(content)

    resume = Resume(
        candidate_id=None,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=relative_path,
        file_size_bytes=file_size,
        mime_type=mime_type,
        uploaded_by=current_user.id,
    )
    db.add(resume)
    await db.flush()

    parse_job = ParseJob(
        resume_id=resume.id,
        status="pending",
    )
    db.add(parse_job)
    await db.commit()
    await db.refresh(parse_job)

    background_tasks.add_task(_process_resume, str(parse_job.id))

    logger.info(f"Resume upload queued: parse_job={parse_job.id}")

    return ResumeUploadResponse(
        resume_id=resume.id,
        parse_job_id=parse_job.id,
        status="pending",
        message="Resume uploaded. Parsing started in background.",
    )


@router.get("/parse-jobs/{parse_job_id}", response_model=ParseJobResponse)
async def get_parse_job(
    parse_job_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ParseJob).where(ParseJob.id == parse_job_id)
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parse job not found",
        )
    return job


@router.get("/candidates/{candidate_id}/resume")
async def download_resume(
    candidate_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Candidate).where(Candidate.id == candidate_id)
    )
    candidate = result.scalar_one_or_none()
    if not candidate or not candidate.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found or inactive",
        )

    result = await db.execute(
        select(Resume)
        .where(Resume.candidate_id == candidate_id)
        .where(Resume.is_latest == True)
        .order_by(Resume.uploaded_at.desc())
        .limit(1)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found for this candidate",
        )

    return build_file_response(
        resume.file_path,
        resume.original_filename,
        settings.upload_dir
    )