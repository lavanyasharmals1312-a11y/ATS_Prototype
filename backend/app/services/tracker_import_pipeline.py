import re
import math
from uuid import UUID
from typing import Any, Protocol, runtime_checkable

import pandas as pd
from pathlib import Path
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.candidate import Candidate
from app.models.import_batch import ImportBatch
from app.services.duplicate_detector import build_detector, normalize_phone


# ── COLUMN_MAP ─────────────────────────────────────────────

COLUMN_MAP: dict[str, list[str]] = {
    "candidate_name": [
        "candidate name", "full name", "name", "applicant name",
        "candidate", "candidate_name",
    ],
    "candidate_email": [
        "email", "email id", "email address", "mail id",
        "mail", "e-mail", "candidate email",
    ],
    "candidate_phone": [
        "phone", "mobile", "contact", "contact no", "phone no",
        "mobile no", "mob", "ph", "cell", "telephone",
        "candidate no", "candidate phone",
    ],
    "current_company": [
        "current company", "company", "current employer",
        "organization", "organisation", "present company",
        "employer", "current organization",
    ],
    "experience_years": [
        "experience", "exp", "total exp", "total experience",
        "years of experience", "experience (yrs)", "experience [yrs]",
        "work experience", "professional experience",
    ],
    "current_location": [
        "location", "city", "current location", "current city",
        "present location",
    ],
    "preferred_location": [
        "preferred location", "preferred city", "preferred_location",
    ],
    "notice_period": [
        "notice period", "notice", "np", "availability",
        "joining period", "available to join",
    ],
    "current_ctc": [
        "current ctc", "ctc", "salary", "current salary",
        "package", "annual ctc", "fixed ctc",
    ],
    "expected_ctc": [
        "expected ctc", "expected salary", "expected package",
        "desired ctc", "target ctc",
    ],
    "current_designation": [
        "designation", "current designation", "role",
        "current role", "position", "job title", "title",
    ],
    "highest_qualification": [
        "qualification", "highest qualification", "education",
        "degree", "academic qualification",
    ],
    "university": [
        "university", "college", "institution", "institute",
    ],
    "skills_as_tags": [
        "skills", "key skills", "technical skills", "skill set",
        "role", "applied role", "position applied",
    ],
    "source_tag": [
        "source name", "source file", "credit owner", "creditowner",
        "hr name", "recruiter",
    ],
}


# ── FileReader ─────────────────────────────────────────────

class FileReader:
    def read(self, path: str) -> pd.DataFrame:
        ext = Path(path).suffix.lower()
        if ext in (".xlsx", ".xls"):
            return pd.read_excel(path, dtype=str)
        elif ext == ".csv":
            return pd.read_csv(path, dtype=str)
        else:
            raise ValueError(f"Unsupported file type: {ext}")


# ── ColumnNormalizer ───────────────────────────────────────

class ColumnNormalizer:
    def normalize(self, df: pd.DataFrame) -> pd.DataFrame:
        alias_lookup: dict[str, str] = {}
        for canonical, aliases in COLUMN_MAP.items():
            for alias in aliases:
                alias_lookup[alias.strip().lower()] = canonical

        rename_map: dict[str, str] = {}
        for col in df.columns:
            normalized = col.strip().lower()
            if normalized in alias_lookup:
                rename_map[col] = alias_lookup[normalized]

        return df.rename(columns=rename_map)


# ── FieldTransformer Protocol ──────────────────────────────

@runtime_checkable
class FieldTransformer(Protocol):
    @property
    def field_name(self) -> str: ...
    def transform(self, value: Any) -> Any: ...


# ── Concrete FieldTransformers ─────────────────────────────

class EmailTransformer:
    field_name = "candidate_email"
    def transform(self, value: Any) -> str | None:
        if not value or str(value).strip() in ("", "nan", "None"):
            return None
        return str(value).strip().lower()


class PhoneTransformer:
    field_name = "candidate_phone"
    def transform(self, value: Any) -> str | None:
        if not value or str(value).strip() in ("", "nan", "None"):
            return None
        raw = str(value).strip()
        if raw.endswith(".0"):
            raw = raw[:-2]
        digits = re.sub(r'\D', '', raw)
        if len(digits) == 12 and digits.startswith('91'):
            digits = digits[2:]
        if len(digits) == 11 and digits.startswith('0'):
            digits = digits[1:]
        return digits if len(digits) == 10 else None


class ExperienceTransformer:
    field_name = "experience_years"
    def transform(self, value: Any) -> float | None:
        if not value or str(value).strip() in ("", "nan", "None"):
            return None
        raw = str(value).strip()
        match = re.search(r'(\d+(?:\.\d+)?)', raw)
        if not match:
            return None
        try:
            num_str = match.group(1)
            val = float(num_str)
            integer_part = int(val)
            decimal_str = num_str.split(".")[-1] if "." in num_str else "0"
            decimal_val = int(decimal_str)
            if decimal_val > 9:
                return round(integer_part + decimal_val / 12, 2)
            return val
        except (ValueError, IndexError):
            return None


class NoticePeriodTransformer:
    field_name = "notice_period"

    _IMMEDIATE = re.compile(r'immediate', re.IGNORECASE)
    _DAYS = re.compile(r'(\d+)\s*days?', re.IGNORECASE)
    _LWD = re.compile(r'lwd|last working day|serving notice', re.IGNORECASE)

    def transform(self, value: Any) -> str | None:
        if not value or str(value).strip() in ("", "nan", "None"):
            return None
        raw = str(value).strip()
        if self._IMMEDIATE.search(raw):
            return "Immediate"
        if self._LWD.search(raw):
            return "Serving Notice"
        days_match = self._DAYS.search(raw)
        if days_match:
            days = int(days_match.group(1))
            if days <= 15:
                return "15 Days"
            elif days <= 30:
                return "30 Days"
            elif days <= 45:
                return "45 Days"
            elif days <= 60:
                return "60 Days"
            else:
                return "90 Days"
        return raw[:100]


class SkillsAsTagsTransformer:
    field_name = "skills_as_tags"
    def transform(self, value: Any) -> list[str]:
        if not value or str(value).strip() in ("", "nan", "None"):
            return []
        return [tag.strip() for tag in str(value).split(",") if tag.strip()]


class SourceTagTransformer:
    field_name = "source_tag"
    def transform(self, value: Any) -> list[str]:
        if not value or str(value).strip() in ("", "nan", "None"):
            return []
        return [str(value).strip()]


class TextFieldTransformer:
    def __init__(self, field_name: str):
        self._field_name = field_name

    @property
    def field_name(self) -> str:
        return self._field_name

    def transform(self, value: Any) -> str | None:
        if not value or str(value).strip() in ("", "nan", "None"):
            return None
        return str(value).strip()[:500]


# ── RowTransformerRegistry ─────────────────────────────────

class RowTransformerRegistry:
    def __init__(self, transformers: list[FieldTransformer]):
        self._map: dict[str, FieldTransformer] = {
            t.field_name: t for t in transformers
        }

    def transform_row(self, row: dict) -> dict:
        result: dict = {}
        for field, value in row.items():
            transformer = self._map.get(field)
            if transformer:
                try:
                    result[field] = transformer.transform(value)
                except Exception as e:
                    logger.warning(f"Transform failed for {field}: {e}")
                    result[field] = None
            else:
                result[field] = value
        return result


def build_transformer_registry() -> RowTransformerRegistry:
    return RowTransformerRegistry(transformers=[
        EmailTransformer(),
        PhoneTransformer(),
        ExperienceTransformer(),
        NoticePeriodTransformer(),
        SkillsAsTagsTransformer(),
        SourceTagTransformer(),
        TextFieldTransformer("candidate_name"),
        TextFieldTransformer("current_company"),
        TextFieldTransformer("current_location"),
        TextFieldTransformer("preferred_location"),
        TextFieldTransformer("current_ctc"),
        TextFieldTransformer("expected_ctc"),
        TextFieldTransformer("current_designation"),
        TextFieldTransformer("highest_qualification"),
        TextFieldTransformer("university"),
    ])


# ── Row Processing ─────────────────────────────────────────

CHUNK_SIZE = 100


async def _check_duplicate(
    email: str | None,
    phone: str | None,
    db: AsyncSession,
) -> bool:
    if email:
        existing = await db.scalar(
            select(Candidate).where(
                func.lower(Candidate.candidate_email) == email.lower(),
                Candidate.is_active == True,
            )
        )
        if existing:
            return True
    if phone and not email:
        normalized = normalize_phone(phone)
        db_norm = func.regexp_replace(
            Candidate.candidate_phone, r'[^0-9]', '', 'g'
        )
        existing = await db.scalar(
            select(Candidate).where(
                db_norm == normalized,
                Candidate.is_active == True,
            )
        )
        if existing:
            return True
    return False


async def _create_from_row(
    row: dict,
    imported_by: UUID,
    db: AsyncSession,
) -> Candidate:
    tags: list[str] = []
    tags.extend(row.pop("skills_as_tags", None) or [])
    tags.extend(row.pop("source_tag", None) or [])

    candidate = Candidate(
        candidate_name=row.get("candidate_name"),
        candidate_email=row.get("candidate_email"),
        candidate_phone=row.get("candidate_phone"),
        current_designation=row.get("current_designation"),
        current_company=row.get("current_company"),
        experience_years=row.get("experience_years"),
        current_location=row.get("current_location"),
        preferred_location=row.get("preferred_location"),
        notice_period=row.get("notice_period"),
        current_ctc=row.get("current_ctc"),
        expected_ctc=row.get("expected_ctc"),
        highest_qualification=row.get("highest_qualification"),
        university=row.get("university"),
        skills=[],
        tags=tags if tags else [],
        source="import",
        is_active=True,
        created_by=imported_by,
    )
    db.add(candidate)
    await db.flush()
    return candidate


# ── Pipeline Orchestration ─────────────────────────────────

async def process_import_batch(
    batch: ImportBatch,
    db: AsyncSession,
) -> None:
    from app.repositories.import_repository import ImportBatchRepository
    repo = ImportBatchRepository(db)

    try:
        reader = FileReader()
        df = reader.read(batch.stored_path)
        df = ColumnNormalizer().normalize(df)
        transformer = build_transformer_registry()

        df = df.dropna(how="all")
        total = len(df)

        await repo.set_processing(batch, total)
        logger.info(f"Import batch {batch.id}: {total} rows to process")

        error_log: list[dict] = []

        for i, (_, row) in enumerate(df.iterrows()):
            row_num = i + 2
            try:
                cleaned = transformer.transform_row(row.to_dict())
                email = cleaned.get("candidate_email")
                phone = cleaned.get("candidate_phone")

                if not email and not phone:
                    await repo.increment_error(batch)
                    error_log.append({
                        "row": row_num,
                        "error": "No email or phone — skipped"
                    })
                    continue

                is_dup = await _check_duplicate(email, phone, db)
                if is_dup:
                    await repo.increment_duplicate(batch)
                    continue

                candidate = await _create_from_row(
                    cleaned, batch.imported_by, db
                )
                detector = build_detector()
                await detector.check(candidate, db)
                await repo.increment_success(batch)

            except Exception as e:
                await repo.increment_error(batch)
                error_log.append({"row": row_num, "error": str(e)})
                logger.warning(
                    f"Import batch {batch.id} row {row_num}: {e}"
                )

            if (i + 1) % CHUNK_SIZE == 0:
                await repo.flush_counters(batch, error_log)
                logger.info(
                    f"Import batch {batch.id}: {i+1}/{total} rows processed"
                )

        await repo.set_completed(batch, error_log)
        logger.info(
            f"Import batch {batch.id} complete: "
            f"{batch.successful_rows} imported, "
            f"{batch.duplicate_rows} duplicates, "
            f"{batch.error_rows} errors"
        )

    except Exception as e:
        logger.exception(f"Import batch {batch.id} failed: {e}")
        await repo.set_failed(batch, str(e))
        raise
