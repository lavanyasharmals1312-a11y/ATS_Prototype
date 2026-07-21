import re
import logging
from uuid import UUID
from typing import Protocol, runtime_checkable

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import Candidate
from app.models.duplicate_flag import DuplicateFlag

logger = logging.getLogger(__name__)


# ── Normalization Helpers ──────────────────────────────────

def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_phone(phone: str) -> str:
    """
    Strip all non-digits.
    Remove leading 91 if result is 12 digits (Indian prefix).
    Returns 10-digit string or original digits if unexpected length.
    """
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 12 and digits.startswith('91'):
        return digits[2:]
    if len(digits) == 11 and digits.startswith('0'):
        return digits[1:]
    return digits


def ordered_pair(a: UUID, b: UUID) -> tuple[UUID, UUID]:
    """
    Always returns (smaller_str, larger_str).
    Prevents (A,B) and (B,A) from both existing in DB,
    which would bypass the UNIQUE constraint.
    """
    return (a, b) if str(a) < str(b) else (b, a)


# ── DuplicateChecker Protocol ──────────────────────────────

@runtime_checkable
class DuplicateChecker(Protocol):
    @property
    def reason(self) -> str: ...

    @property
    def confidence(self) -> float: ...

    async def find_matches(
        self,
        candidate: Candidate,
        exclude_id: UUID,
        db: AsyncSession,
    ) -> list[Candidate]: ...


# ── Concrete Checker Strategies ────────────────────────────

class EmailDuplicateChecker:
    reason = "email"
    confidence = 1.00

    async def find_matches(
        self, candidate: Candidate, exclude_id: UUID, db: AsyncSession
    ) -> list[Candidate]:
        if not candidate.candidate_email:
            return []
        normalized = normalize_email(candidate.candidate_email)
        result = await db.execute(
            select(Candidate).where(
                func.lower(Candidate.candidate_email) == normalized,
                Candidate.id != exclude_id,
                Candidate.is_active == True,
            )
        )
        return list(result.scalars().all())


class PhoneDuplicateChecker:
    reason = "phone"
    confidence = 0.95

    async def find_matches(
        self, candidate: Candidate, exclude_id: UUID, db: AsyncSession
    ) -> list[Candidate]:
        if not candidate.candidate_phone:
            return []
        normalized = normalize_phone(candidate.candidate_phone)
        if len(normalized) < 10:
            return []
        db_normalized = func.regexp_replace(
            Candidate.candidate_phone, r'[^0-9]', '', 'g'
        )
        result = await db.execute(
            select(Candidate).where(
                db_normalized == normalized,
                Candidate.id != exclude_id,
                Candidate.is_active == True,
            )
        )
        return list(result.scalars().all())


class NameCompanyDuplicateChecker:
    reason = "name_company"
    confidence = 0.70

    async def find_matches(
        self, candidate: Candidate, exclude_id: UUID, db: AsyncSession
    ) -> list[Candidate]:
        if not candidate.candidate_name or not candidate.current_company:
            return []
        result = await db.execute(
            select(Candidate).where(
                func.lower(Candidate.candidate_name) == candidate.candidate_name.lower(),
                func.lower(Candidate.current_company) == candidate.current_company.lower(),
                Candidate.id != exclude_id,
                Candidate.is_active == True,
            )
        )
        return list(result.scalars().all())


# ── DuplicateDetector ──────────────────────────────────────

class DuplicateDetector:
    """
    Orchestrates all registered DuplicateCheckers.
    Single responsibility: run checkers, create flags, update statuses.
    Adding a new checker = register it in build_detector().
    Nothing here changes.
    """
    def __init__(self, checkers: list[DuplicateChecker]):
        self.checkers = checkers

    async def check(
        self, candidate: Candidate, db: AsyncSession
    ) -> list[DuplicateFlag]:
        created_flags: list[DuplicateFlag] = []
        for checker in self.checkers:
            matches = await checker.find_matches(candidate, candidate.id, db)
            for match in matches:
                flag = await self._get_or_create_flag(
                    candidate.id, match.id,
                    checker.reason, checker.confidence, db
                )
                if flag:
                    created_flags.append(flag)
                    await self._mark_flagged(candidate, db)
                    await self._mark_flagged(match, db)
        return created_flags

    async def _get_or_create_flag(
        self,
        id_a: UUID, id_b: UUID,
        reason: str, confidence: float,
        db: AsyncSession,
    ) -> DuplicateFlag | None:
        a, b = ordered_pair(id_a, id_b)
        existing = await db.execute(
            select(DuplicateFlag).where(
                DuplicateFlag.candidate_id_a == a,
                DuplicateFlag.candidate_id_b == b,
            )
        )
        if existing.scalar_one_or_none():
            return None   # Already flagged — idempotent
        flag = DuplicateFlag(
            candidate_id_a=a, candidate_id_b=b,
            reason=reason, confidence=confidence,
            status="pending",
        )
        db.add(flag)
        await db.flush()
        return flag

    async def _mark_flagged(
        self, candidate: Candidate, db: AsyncSession
    ) -> None:
        if candidate.duplicate_status == "clean":
            candidate.duplicate_status = "flagged"


# ── Factory ────────────────────────────────────────────────

def build_detector() -> DuplicateDetector:
    """
    Register all active checkers here.
    Adding a new detection strategy = add one line here.
    Zero other files change.
    """
    return DuplicateDetector(checkers=[
        EmailDuplicateChecker(),
        PhoneDuplicateChecker(),
        NameCompanyDuplicateChecker(),
    ])


async def run_full_scan(db: AsyncSession) -> int:
    """
    Background task: scan every active candidate for duplicates.
    Returns total number of new flags created.
    """
    from sqlalchemy import select as sa_select
    result = await db.execute(
        sa_select(Candidate).where(Candidate.is_active == True)
    )
    candidates = list(result.scalars().all())
    detector = build_detector()
    total = 0
    for candidate in candidates:
        flags = await detector.check(candidate, db)
        total += len(flags)
    await db.commit()
    logger.info(f"Full duplicate scan complete: {total} new flag(s) across {len(candidates)} candidates")
    return total