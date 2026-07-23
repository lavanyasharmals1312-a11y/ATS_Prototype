import pytest
import pandas as pd
from app.services.tracker_import_pipeline import (
    ColumnNormalizer,
    build_transformer_registry,
    COLUMN_MAP,
)


def test_column_normalizer_basic():
    df = pd.DataFrame({
        "Candidate Name": ["Rahul"],
        "Email": ["rahul@example.com"],
        "Mobile": ["9876543210"],
        "Experience [Yrs]": ["5.6 Years"],
    })
    normalizer = ColumnNormalizer()
    result = normalizer.normalize(df)
    assert "candidate_name" in result.columns
    assert "candidate_email" in result.columns
    assert "candidate_phone" in result.columns
    assert "experience_years" in result.columns


def test_column_normalizer_case_insensitive():
    df = pd.DataFrame({"MOBILE NO": ["9876543210"]})
    result = ColumnNormalizer().normalize(df)
    assert "candidate_phone" in result.columns


def test_phone_transformer_float():
    """Excel stores phone numbers as floats: 9876543210.0"""
    registry = build_transformer_registry()
    row = {"candidate_phone": "9876543210.0"}
    result = registry.transform_row(row)
    assert result["candidate_phone"] == "9876543210"


def test_phone_transformer_with_prefix():
    registry = build_transformer_registry()
    row = {"candidate_phone": "+91 9876543210"}
    result = registry.transform_row(row)
    assert result["candidate_phone"] == "9876543210"


def test_experience_transformer_month_notation():
    """3.10 means 3 years 10 months — not 3.10 years"""
    registry = build_transformer_registry()
    row = {"experience_years": "3.10 Years"}
    result = registry.transform_row(row)
    assert abs(result["experience_years"] - 3.83) < 0.01


def test_notice_period_transformer_immediate():
    registry = build_transformer_registry()
    for variant in ["Immediate Joiner", "immediate joinee", "Immediate"]:
        row = {"notice_period": variant}
        result = registry.transform_row(row)
        assert result["notice_period"] == "Immediate"


def test_notice_period_transformer_lwd():
    registry = build_transformer_registry()
    row = {"notice_period": "LWD - 14 Jan 2026 (negotiable)"}
    result = registry.transform_row(row)
    assert result["notice_period"] == "Serving Notice"


def test_notice_period_transformer_days():
    registry = build_transformer_registry()
    cases = [
        ("30 Days", "30 Days"),
        ("Np- 45 Days (Negotiable)", "45 Days"),
        ("Official 90 days", "90 Days"),
    ]
    for raw, expected in cases:
        result = registry.transform_row({"notice_period": raw})
        assert result["notice_period"] == expected


def test_skills_as_tags_transformer():
    """Skills column in tracker = role labels → tags, not skills"""
    registry = build_transformer_registry()
    row = {"skills_as_tags": "Data Analyst, GCP"}
    result = registry.transform_row(row)
    assert result["skills_as_tags"] == ["Data Analyst", "GCP"]


def test_nan_handling():
    """All transformers must handle NaN gracefully"""
    registry = build_transformer_registry()
    row = {
        "candidate_email": "nan",
        "candidate_phone": "nan",
        "experience_years": "nan",
    }
    result = registry.transform_row(row)
    assert result["candidate_email"] is None
    assert result["candidate_phone"] is None
    assert result["experience_years"] is None