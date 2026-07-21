import re
import logging
from pathlib import Path
from typing import Protocol, Any, runtime_checkable

logger = logging.getLogger(__name__)


@runtime_checkable
class FieldExtractor(Protocol):
    @property
    def field_name(self) -> str: ...
    def extract(self, text: str) -> Any: ...


class PatternExtractor:
    def __init__(self, field_name: str, pattern: str, group: int = 0, transform=None):
        self._field_name = field_name
        self._pattern = re.compile(pattern, re.IGNORECASE)
        self._group = group
        self._transform = transform or (lambda x: x)

    @property
    def field_name(self) -> str:
        return self._field_name

    def extract(self, text: str) -> str | None:
        match = self._pattern.search(text)
        if not match:
            return None
        try:
            return self._transform(match.group(self._group))
        except Exception:
            return None


class LabeledExtractor:
    def __init__(self, field_name: str, aliases: list[str], value_pattern: str = r"([^\n\r]{1,80})"):
        self._field_name = field_name
        self.aliases = aliases
        self.value_pattern = value_pattern

    @property
    def field_name(self) -> str:
        return self._field_name

    def extract(self, text: str) -> str | None:
        for alias in self.aliases:
            escaped = re.escape(alias)
            pattern = rf"(?i)\b{escaped}\b\s*[:\-]\s*{self.value_pattern}"
            match = re.search(pattern, text, re.MULTILINE)
            if match:
                value = match.group(1).strip()
                if value:
                    return value
        return None


class ListMatchExtractor:
    def __init__(self, field_name: str, lookup_list: list[str], return_all: bool = False):
        self._field_name = field_name
        self.lookup_list = lookup_list
        self.return_all = return_all

    @property
    def field_name(self) -> str:
        return self._field_name

    def extract(self, text: str) -> list[str] | str | None:
        found = []
        for item in self.lookup_list:
            pattern = rf"\b{re.escape(item)}\b"
            if re.search(pattern, text, re.IGNORECASE):
                found.append(item)
        if not found:
            return [] if self.return_all else None
        return found if self.return_all else found[0]


class HeuristicExtractor:
    _SKIP_PATTERNS = re.compile(
        r"@|http|www|linkedin|github|\d{5,}|resume|curriculum|cv\b",
        re.IGNORECASE
    )
    _TITLE_PREFIXES = re.compile(
        r"^(mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?)\s+",
        re.IGNORECASE
    )

    def __init__(self, field_name: str):
        self._field_name = field_name

    @property
    def field_name(self) -> str:
        return self._field_name

    def extract(self, text: str) -> str | None:
        lines = [l.strip() for l in text[:800].splitlines() if l.strip()]
        for line in lines[:8]:
            if self._SKIP_PATTERNS.search(line):
                continue
            if len(line) > 60 or len(line) < 2:
                continue
            cleaned = self._TITLE_PREFIXES.sub("", line).strip()
            if cleaned:
                return cleaned
        return None


class ExtractorRegistry:
    def __init__(self):
        self._extractors: dict[str, FieldExtractor] = {}

    def register(self, extractor: FieldExtractor) -> "ExtractorRegistry":
        self._extractors[extractor.field_name] = extractor
        return self

    def extract_all(self, text: str) -> dict:
        result = {}
        for field_name, extractor in self._extractors.items():
            try:
                result[field_name] = extractor.extract(text)
            except Exception as e:
                logger.warning(f"Extractor failed for {field_name}: {e}")
                result[field_name] = None
        return result


def _normalize_experience(raw: str) -> float | None:
    raw = re.sub(r"[^\d.]", "", raw.split()[0] if raw.split() else raw)
    if not raw:
        return None
    try:
        if "." in raw:
            integer_part, decimal_part = raw.split(".", 1)
            integer_val = int(integer_part)
            decimal_val = int(decimal_part)
            if decimal_val > 9:
                return round(integer_val + decimal_val / 12, 2)
            return float(raw)
        return float(raw)
    except (ValueError, IndexError):
        return None


def _load_list(path: Path) -> list[str]:
    try:
        return [l.strip() for l in path.read_text().splitlines() if l.strip()]
    except Exception as e:
        logger.warning(f"Could not load list {path}: {e}")
        return []


_DATA_DIR = Path(__file__).parent.parent.parent / "data"
SKILLS_LIST = _load_list(_DATA_DIR / "skills_list.txt")
LOCATIONS_LIST = _load_list(_DATA_DIR / "locations_list.txt")


def build_registry() -> ExtractorRegistry:
    registry = ExtractorRegistry()

    registry.register(HeuristicExtractor("candidate_name"))

    registry.register(PatternExtractor(
        field_name="candidate_email",
        pattern=r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
        transform=str.lower,
    ))

    registry.register(PatternExtractor(
        field_name="candidate_phone",
        pattern=r"(?:\+91[\s\-]?|91[\s\-]?)?([6-9]\d{9})",
        group=1,
    ))

    registry.register(PatternExtractor(
        field_name="experience_years",
        pattern=r"(\d+(?:\.\d+)?)\s*(?:\+\s*)?(?:years?|yrs?|year of exp)",
        group=1,
        transform=_normalize_experience,
    ))

    registry.register(ListMatchExtractor(
        field_name="skills",
        lookup_list=SKILLS_LIST,
        return_all=True,
    ))

    registry.register(ListMatchExtractor(
        field_name="current_location",
        lookup_list=LOCATIONS_LIST,
        return_all=False,
    ))

    registry.register(LabeledExtractor(
        field_name="notice_period",
        aliases=[
            "notice period", "notice", "np", "availability",
            "joining period", "available to join", "available from",
        ],
    ))

    registry.register(LabeledExtractor(
        field_name="current_ctc",
        aliases=[
            "current ctc", "ctc", "current salary", "current package",
            "present ctc", "fixed ctc", "annual ctc", "salary",
        ],
    ))

    registry.register(LabeledExtractor(
        field_name="expected_ctc",
        aliases=[
            "expected ctc", "expected salary", "expected package",
            "desired ctc", "target ctc", "asking salary",
        ],
    ))

    registry.register(LabeledExtractor(
        field_name="current_designation",
        aliases=[
            "current designation", "designation", "current role",
            "role", "current position", "position", "job title",
            "current title", "title",
        ],
    ))

    registry.register(LabeledExtractor(
        field_name="current_company",
        aliases=[
            "current company", "current employer", "present company",
            "current organization", "organisation", "organization",
            "employer", "company",
        ],
    ))

    return registry


class RuleBasedParser:
    def __init__(self, registry: ExtractorRegistry | None = None):
        self._registry = registry or build_registry()

    async def parse(self, text: str) -> dict:
        if not text.strip():
            logger.warning("Empty text passed to RuleBasedParser")
            return self._empty_result()

        raw = self._registry.extract_all(text)

        return {
            "candidate_name": raw.get("candidate_name") or "",
            "candidate_email": raw.get("candidate_email") or "",
            "candidate_phone": raw.get("candidate_phone") or "",
            "current_company": raw.get("current_company") or "",
            "current_designation": raw.get("current_designation") or "",
            "experience_years": raw.get("experience_years"),
            "current_location": raw.get("current_location") or "",
            "preferred_location": "",
            "notice_period": raw.get("notice_period") or "",
            "current_ctc": raw.get("current_ctc") or "",
            "expected_ctc": raw.get("expected_ctc") or "",
            "highest_qualification": "",
            "university": "",
            "skills": raw.get("skills") or [],
        }

    def _empty_result(self) -> dict:
        return {k: "" for k in [
            "candidate_name", "candidate_email", "candidate_phone",
            "current_company", "current_designation", "current_location",
            "preferred_location", "notice_period", "current_ctc",
            "expected_ctc", "highest_qualification", "university",
        ]} | {"experience_years": None, "skills": []}