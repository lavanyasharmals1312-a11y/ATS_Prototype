"""
parse_pipeline.py
-----------------
Orchestrates the full parse flow for one resume job.

Parsing strategy (AI-first):
  1. Extract raw text from file (PDF/DOCX)
  2. If ENABLE_AI_PARSING=true  → GeminiParser runs FIRST as primary source
     Rule-based parser fills any fields Gemini left empty.
  3. If ENABLE_AI_PARSING=false → Rule-based parser only (legacy behavior).
  4. Save candidate, run duplicate detection.
"""

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
    """Background task entry point — creates its own DB session."""
    async with AsyncSessionLocal() as db:
        await process(parse_job_id, db)


async def process(parse_job_id: UUID, db: AsyncSession) -> None:
    """
    Full parse flow for one parse_job_id.

    AI runs FIRST (primary) when enabled.
    Rule-based fills gaps left by AI.
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
        # ── Step 1: Extract text ─────────────────────────────────────────
        extractor = ResumeExtractor()
        raw_text = await extractor.extract(resume.file_path, resume.mime_type)

        if not raw_text.strip():
            raise ValueError("No text could be extracted from the resume file.")

        logger.info(
            f"Parse job {parse_job_id}: extracted {len(raw_text)} chars "
            f"from {resume.original_filename!r}"
        )

        # ── Step 2: Parse ────────────────────────────────────────────────
        if settings.enable_ai_parsing:
            # AI FIRST — primary source of truth
            from app.services.ai_parser import GeminiParser

            ai_result = await GeminiParser().parse(raw_text)

            # Rule-based fills fields that Gemini left empty
            rule_parser = RuleBasedParser()
            rule_result = await rule_parser.parse(raw_text)

            parsed = ai_result or {}
            for key, rule_value in rule_result.items():
                if not parsed.get(key) and rule_value:
                    parsed[key] = rule_value

            job.parser_used = "ai_primary_rule_fallback" if ai_result else "rule_based_fallback"
            logger.info(
                f"Parse job {parse_job_id}: strategy={job.parser_used} "
                f"ai_fields={sum(1 for v in ai_result.values() if v) if ai_result else 0}"
            )
        else:
            # Rule-based only (legacy / no API key)
            rule_parser = RuleBasedParser()
            parsed = await rule_parser.parse(raw_text)
            job.parser_used = "rule_based"

        # ── Step 3: Save candidate ───────────────────────────────────────
        candidate = Candidate(
            candidate_name=parsed.get("candidate_name") or None,
            candidate_email=parsed.get("candidate_email") or None,
            candidate_phone=parsed.get("candidate_phone") or None,
            current_designation=parsed.get("current_designation") or None,
            current_company=parsed.get("current_company") or None,
            experience_years=_safe_float(parsed.get("experience_years")),
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

        # ── Step 4: Duplicate detection ──────────────────────────────────
        detector = build_detector()
        dup_flags = await detector.check(candidate, db)
        if dup_flags:
            logger.info(
                f"Parse job {parse_job_id}: {len(dup_flags)} duplicate flag(s) "
                f"for candidate {candidate.id}"
            )

        resume.candidate_id = candidate.id
        job.status = "completed"
        job.raw_text = raw_text[:50_000]
        job.parsed_data = parsed
        job.completed_at = func.now()
        await db.commit()

        logger.info(
            f"Parse completed: job={parse_job_id} candidate={candidate.id} "
            f"name={candidate.candidate_name!r}"
        )

    except Exception as e:
        logger.exception(f"Parse failed for job {parse_job_id}: {e}")
        job.status = "failed"
        job.error_message = str(e)[:500]
        job.completed_at = func.now()
        await db.commit()


def _safe_float(value) -> float | None:
    """Convert experience_years to float, returning None on failure."""
    if value is None or value == "":
        return None
    try:
        return float(str(value).strip())
    except (ValueError, TypeError):
        return None