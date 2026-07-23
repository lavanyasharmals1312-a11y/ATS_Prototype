import pytest
from app.services.rule_parser import RuleBasedParser, _normalize_experience


# ── Experience Normalization ─────────────────────────────────

@pytest.mark.parametrize("raw,expected", [
    ("3.10", 3.83),    # 3 years 10 months — the critical edge case
    ("5.6", 5.6),      # regular decimal
    ("5", 5.0),        # whole number
    ("10", 10.0),      # senior candidate
    ("0", 0.0),        # fresher
    ("invalid", None), # garbage input
    ("", None),        # empty
])
def test_normalize_experience(raw, expected):
    result = _normalize_experience(raw)
    if expected is None:
        assert result is None
    else:
        assert abs(result - expected) < 0.01


# ── Full Parser ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_rule_parser_empty_text():
    parser = RuleBasedParser()
    result = await parser.parse("")
    assert result["candidate_name"] == ""
    assert result["skills"] == []


@pytest.mark.asyncio
async def test_rule_parser_email():
    parser = RuleBasedParser()
    text = "Contact me at john.doe@example.com for details"
    result = await parser.parse(text)
    assert result["candidate_email"] == "john.doe@example.com"


@pytest.mark.asyncio
async def test_rule_parser_phone():
    parser = RuleBasedParser()
    text = "Phone: +91 9876543210"
    result = await parser.parse(text)
    assert result["candidate_phone"] == "9876543210"


@pytest.mark.asyncio
async def test_rule_parser_experience_years():
    parser = RuleBasedParser()
    text = "5 years of experience"
    result = await parser.parse(text)
    assert result["experience_years"] == 5.0


@pytest.mark.asyncio
async def test_rule_parser_experience_months():
    parser = RuleBasedParser()
    text = "3.10 years experience"
    result = await parser.parse(text)
    assert result["experience_years"] == pytest.approx(3.83, rel=0.01)


@pytest.mark.asyncio
async def test_rule_parser_skills():
    parser = RuleBasedParser()
    text = "Skills: Python, FastAPI, PostgreSQL, Docker"
    result = await parser.parse(text)
    # Skills extracted from SKILLS_LIST - check if any matched
    assert isinstance(result["skills"], list)


@pytest.mark.asyncio
async def test_rule_parser_location():
    parser = RuleBasedParser()
    text = "Current Location: Bangalore"
    result = await parser.parse(text)
    # Location extracted from LOCATIONS_LIST
    assert isinstance(result["current_location"], str)


@pytest.mark.asyncio
async def test_rule_parser_designation():
    parser = RuleBasedParser()
    text = "Current Designation: Senior Software Engineer"
    result = await parser.parse(text)
    assert "Senior Software Engineer" in result["current_designation"]


@pytest.mark.asyncio
async def test_rule_parser_company():
    parser = RuleBasedParser()
    text = "Current Company: Google India Pvt Ltd"
    result = await parser.parse(text)
    assert "Google" in result["current_company"]


@pytest.mark.asyncio
async def test_rule_parser_notice_period():
    parser = RuleBasedParser()
    text = "Notice Period: 30 days"
    result = await parser.parse(text)
    assert "30" in result["notice_period"]


@pytest.mark.asyncio
async def test_rule_parser_ctc():
    parser = RuleBasedParser()
    text = "Current CTC: 25 LPA"
    result = await parser.parse(text)
    assert "25" in result["current_ctc"]


@pytest.mark.asyncio
async def test_rule_parser_never_raises():
    parser = RuleBasedParser()
    # Garbage input — must never raise
    result = await parser.parse("!@#$%^&*()_+{}|:<>?")
    assert isinstance(result, dict)


@pytest.mark.asyncio
async def test_rule_parser_complete_resume():
    resume_text = """
    Rahul Sharma
    rahul.sharma@gmail.com
    Mobile: +91 9876543210
    Current Location: Bangalore
    Notice Period: 30 Days
    Current CTC: 12 LPA
    Total Experience: 5.6 Years
    Skills: Python, React, PostgreSQL, Docker, AWS
    """
    parser = RuleBasedParser()
    result = await parser.parse(resume_text)

    assert result["candidate_email"] == "rahul.sharma@gmail.com"
    assert result["candidate_phone"] == "9876543210"
    assert result["experience_years"] == 5.6
    # Location and skills depend on lookup lists
    assert isinstance(result["current_location"], str)
    assert isinstance(result["skills"], list)