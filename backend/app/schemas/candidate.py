from pydantic import BaseModel, ConfigDict, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional


class CandidateFilters(BaseModel):
    """Query parameter schema for list endpoint."""
    search: Optional[str] = None
    skills: Optional[list[str]] = None
    location: Optional[str] = None
    experience_min: Optional[float] = None
    experience_max: Optional[float] = None
    notice_period: Optional[str] = None
    source: Optional[str] = None


class CandidateUpdate(BaseModel):
    """Partial update — all fields optional. Only set fields are updated."""
    candidate_name: Optional[str] = None
    candidate_email: Optional[EmailStr] = None
    candidate_phone: Optional[str] = None
    current_designation: Optional[str] = None
    current_company: Optional[str] = None
    experience_years: Optional[float] = None
    current_location: Optional[str] = None
    preferred_location: Optional[str] = None
    notice_period: Optional[str] = None
    current_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None
    highest_qualification: Optional[str] = None
    university: Optional[str] = None
    skills: Optional[list[str]] = None
    tags: Optional[list[str]] = None
    notes: Optional[str] = None


class ResumeInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    original_filename: str
    uploaded_at: datetime


class CandidateResponse(BaseModel):
    """Full candidate detail — used for profile and edit pages."""
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    candidate_name: Optional[str]
    candidate_email: Optional[str]
    candidate_phone: Optional[str]
    current_designation: Optional[str]
    current_company: Optional[str]
    experience_years: Optional[float]
    current_location: Optional[str]
    preferred_location: Optional[str]
    notice_period: Optional[str]
    current_ctc: Optional[str]
    expected_ctc: Optional[str]
    highest_qualification: Optional[str]
    university: Optional[str]
    skills: Optional[list[str]]
    tags: Optional[list[str]]
    notes: Optional[str]
    source: Optional[str]
    duplicate_status: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    resumes: list[ResumeInfo] = []


class CandidateListItem(BaseModel):
    """Compact candidate — used for paginated list table."""
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    candidate_name: Optional[str]
    candidate_email: Optional[str]
    candidate_phone: Optional[str]
    current_designation: Optional[str]
    current_company: Optional[str]
    experience_years: Optional[float]
    current_location: Optional[str]
    notice_period: Optional[str]
    skills: Optional[list[str]]
    source: Optional[str]
    duplicate_status: Optional[str]
    created_at: datetime