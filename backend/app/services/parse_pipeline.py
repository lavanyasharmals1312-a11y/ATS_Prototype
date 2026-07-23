from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from loguru import logger

from app.config import settings
from app.models import ParseJob, Resume, Candidate
from app.services.rule_parser import RuleBasedParser
from app.services.resume_extractor import ResumeExtractor
from app.services.duplicate_detector import build_detector
from app.database import AsyncSessionLocal


async def _run_pipeline(parse_job_id: UUID) -> None:
    """Background task entry point - creates its own DB session."""
    async with AsyncSessionLocal() as db:
        await process(parse_job_id, db)


async def process(parse_job_id: UUID, db: AsyncSession) -> None:
    """
    Orchestrates the full parse flow for one parse_job_id.
    Rule-based runs first. AI enhancement runs only if enabled.
    """
    result = await db.execute(select(ParseJob).where(ParseJob.id == parse_job_id))
    job = result.scalar_one_or_none()
    if job is None:
        return

    result = await db.execute(select(Resume).where(Resume.id == job.resume_id))
    resume = result.scalar_one_or_none()
    if resume is None:
        job.status = "failed"
        job.error_message = "Resume record not found"
        await db.commit()
        return

    job.started_at = func.now()
    job.status = "processing"
    await db.commit()

    try:
        # Extract text
        extractor = ResumeExtractor()
        raw_text = await extractor.extract(resume.file_path, resume.mime_type)

        # Rule-based parser always runs first
        parser = RuleBasedParser()
        rule_result = await parser.parse(raw_text)

        # AI enhancement - only fills missing fields
        if settings.enable_ai_parsing:
            from app.services.ai_parser import GeminiParser
            ai_result = await GeminiParser().parse(raw_text)
            if ai_result:
                for key, value in ai_result.items():
                    if not rule_result.get(key) and value:
                        rule_result[key] = value
                job.parser_used = "ai_enhanced"
                logger.info(f"Parse job {job.id}: AI enhancement applied")
            else:
                job.parser_used = "rule_based_only"
        else:
            job.parser_used = "rule_based"

        parsed = rule_result

        # Create candidate
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

        # Duplicate detection
        detector = build_detector()
        dup_flags = await detector.check(candidate, db)
        if dup_flags:
            logger.info(f"Duplicate detection: {len(dup_flags)} flag(s) for candidate {candidate.id}")

        resume.candidate_id = candidate.id
        job.status = "completed"
        job.raw_text = raw_text[:50000]
        job.parsed_data = parsed
        job.completed_at = func.now()
        await db.commit()

        logger.info(f"Parse completed: job={parse_job_id} candidate={candidate.id}")

    except Exception as e:
        logger.exception(f"Parse failed for job {parse_job_id}")
        job.status = "failed"
        job.error_message = str(e)[:500]
        job.completed_at = func.now()
        await db.commit()