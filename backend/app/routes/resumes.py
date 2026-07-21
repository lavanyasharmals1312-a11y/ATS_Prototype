from pathlib import Path
import pdfplumber

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
from app.services.rule_parser import RuleBasedParser
from app.routes.auth import get_current_user
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["resumes"])


def _extract_text_from_pdf(file_path: str) -> str:
    full_path = Path(settings.upload_dir) / file_path
    text_parts = []
    with pdfplumber.open(str(full_path)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
    return "\n".join(text_parts)


def _extract_text_from_docx(file_path: str) -> str:
    from docx import Document
    full_path = Path(settings.upload_dir) / file_path
    doc = Document(str(full_path))
    return "\n".join(p.text for p in doc.paragraphs)


async def _process_resume(parse_job_id: str) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ParseJob).where(ParseJob.id == parse_job_id)
        )
        parse_job = result.scalar_one_or_none()
        if parse_job is None:
            return

        result = await db.execute(
            select(Resume).where(Resume.id == parse_job.resume_id)
        )
        resume = result.scalar_one_or_none()
        if resume is None:
            parse_job.status = "failed"
            parse_job.error_message = "Resume record not found"
            await db.commit()
            return

        parse_job.started_at = func.now()
        parse_job.status = "processing"
        await db.commit()

        try:
            if resume.mime_type == "application/pdf":
                raw_text = _extract_text_from_pdf(resume.file_path)
            elif resume.mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                raw_text = _extract_text_from_docx(resume.file_path)
            else:
                raise ValueError(f"Unsupported mime type: {resume.mime_type}")

            parser = RuleBasedParser()
            parsed = await parser.parse(raw_text)

            candidate = Candidate(
                candidate_name=parsed.get("candidate_name") or None,
                candidate_email=parsed.get("candidate_email") or None,
                candidate_phone=parsed.get("candidate_phone") or None,
                current_designation=parsed.get("current_designation") or None,
                current_company=parsed.get("current_company") or None,
                experience_years=parsed.get("experience_years"),
                current_location=parsed.get("current_location") or None,
                preferred_location=parsed.get("preferred_location") or None,
                notice_period=parsed.get("notice_period") or None,
                current_ctc=parsed.get("current_ctc") or None,
                expected_ctc=parsed.get("expected_ctc") or None,
                highest_qualification=parsed.get("highest_qualification") or None,
                university=parsed.get("university") or None,
                skills=parsed.get("skills") or None,
                source="upload",
            )
            db.add(candidate)
            await db.flush()

            from app.services.duplicate_detector import build_detector
            detector = build_detector()
            dup_flags = await detector.check(candidate, db)
            if dup_flags:
                logger.info(f"Duplicate detection: {len(dup_flags)} flag(s) for candidate {candidate.id}")

            resume.candidate_id = candidate.id
            parse_job.status = "completed"
            parse_job.parser_used = "rule_based"
            parse_job.raw_text = raw_text[:50000]
            parse_job.parsed_data = parsed
            parse_job.completed_at = func.now()
            await db.commit()

            logger.info(f"Parse completed: job={parse_job_id} candidate={candidate.id}")

        except Exception as e:
            logger.exception(f"Parse failed for job {parse_job_id}")
            parse_job.status = "failed"
            parse_job.error_message = str(e)[:500]
            parse_job.completed_at = func.now()
            await db.commit()

@router.post("/resumes/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResumeUploadResponse:
    # 1. Validate file
    await validate_file(file, settings.max_file_size_mb)

    # 2. Store file
    stored_filename, relative_path, mime_type = await store_file(file, settings.upload_dir)

    # 3. Get file size by reading the file again (file pointer is at 0 after store_file)
    content = await file.read()
    await file.seek(0)
    file_size = len(content)

    # 4. Create resume record
    resume = Resume(
        candidate_id=None,  # not linked to candidate yet
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=relative_path,
        file_size_bytes=file_size,
        mime_type=mime_type,
        uploaded_by=current_user.id,
    )
    db.add(resume)
    await db.flush()  # to get the resume.id

    # 5. Create parse job record
    parse_job = ParseJob(
        resume_id=resume.id,
        status="pending",
    )
    db.add(parse_job)
    await db.commit()
    await db.refresh(parse_job)

    # 6. Add background task
    background_tasks.add_task(_process_resume, str(parse_job.id))

    # 7. Log
    logger.info(f"Resume upload queued: parse_job={parse_job.id}")

    # 8. Return response
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
    # Fetch candidate and check if active
    result = await db.execute(
        select(Candidate).where(Candidate.id == candidate_id)
    )
    candidate = result.scalar_one_or_none()
    if not candidate or not candidate.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found or inactive",
        )

    # Fetch latest resume for this candidate
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

    # Build file response
    return build_file_response(
        resume.file_path,
        resume.original_filename,
        settings.upload_dir
    )