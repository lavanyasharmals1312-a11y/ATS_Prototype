from pydantic import BaseModel


class StatsResponse(BaseModel):
    total_candidates: int
    candidates_this_month: int
    pending_duplicates: int
    resumes_uploaded: int
    failed_parse_jobs: int
    skills_indexed: int