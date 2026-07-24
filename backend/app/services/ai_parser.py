"""
ai_parser.py
------------
Gemini-powered resume parser with:
  - Large context window (30 000 chars — Gemini 2.5 Flash supports 1 M tokens)
  - Comprehensive prompt with date-math experience calculation
  - JSON parse error retry (asks Gemini to return only JSON on second attempt)
  - Field coverage logging for observability
"""

import json
import re
from loguru import logger
from app.config import settings


# ── Helpers ───────────────────────────────────────────────────────────────────

def _clean_gemini_response(raw: str) -> str:
    """Strip markdown fences that Gemini sometimes wraps JSON in."""
    cleaned = raw.strip()
    # Remove ```json ... ``` or ``` ... ```
    cleaned = re.sub(r"^```json\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^```\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


# ── Prompt ────────────────────────────────────────────────────────────────────

_PROMPT_TEMPLATE = """\
You are an expert ATS (Applicant Tracking System) resume parser with 10+ years of experience.
Your job is to extract structured information from a resume and return it as valid JSON.

CRITICAL RULES:
- Return ONLY valid JSON. No markdown, no explanations, no preamble.
- If a field cannot be found, return an empty string "" (or [] for skills).
- Do NOT hallucinate or infer information not present in the resume.
- Skills MUST be a JSON array of strings.

FIELD EXTRACTION GUIDE:

candidate_name:
  The full name of the candidate, usually at the very top of the resume.
  Remove honorifics (Mr., Ms., Dr.) if present.

candidate_email:
  The email address. Look in header, contact section.

candidate_phone:
  10-digit mobile number (Indian format preferred). Strip country code.

current_designation:
  The candidate's MOST RECENT job title.
  Look for: the title beside the latest company, "Current Role:", "Designation:"
  Examples: Software Engineer, Senior Data Scientist, Product Manager
  Do NOT return department names or company names.

current_company:
  The candidate's MOST RECENT employer.
  Look for the company beside the latest job entry.
  Do NOT return designation.

experience_years:
  Total years of professional work experience as a decimal number.
  Method 1: If explicitly stated ("5 years experience"), extract that number.
  Method 2: Calculate from work history dates (most recent end - earliest start).
             Use today's date (2025) as the end date if "Present" or "Current".
  Return numeric only, e.g. 2.5, 5, 10.2. No text, no units.

current_location:
  The candidate's CURRENT city/location.
  Priority order:
    1. "Current Location:" or "Location:" label
    2. City beside the latest company
    3. Address in the header
  Ignore: preferred location, university location, previous job cities.
  Return city only or "City, State". E.g., "Bengaluru", "Pune, Maharashtra".

preferred_location:
  Any stated preferred or desired work location.
  Look for: "Preferred Location:", "Willing to relocate to:", "Open to:"
  Return empty string if not found.

notice_period:
  How soon the candidate can join.
  Look for: "Notice Period:", "Serving notice", "Immediate joiner", "Available from"
  Examples: "Immediate", "30 days", "60 days", "Serving notice - 30 days"
  Return empty string if not stated.

current_ctc:
  Current salary / compensation.
  Look for: "Current CTC:", "Current Salary:", "Fixed CTC:", "CTC:", "Package:"
  Include units: "12 LPA", "₹8,00,000", "8L"
  Return empty string if not stated.

expected_ctc:
  Expected salary.
  Look for: "Expected CTC:", "Expected Salary:", "Desired Salary:", "Ask:"
  Return empty string if not stated.

highest_qualification:
  The HIGHEST degree the candidate holds.
  Normalize to standard abbreviations:
    Bachelor of Technology / B.E. → B.Tech
    Bachelor of Engineering → B.E.
    Master of Technology → M.Tech
    Master of Science → M.Sc.
    Master of Business Administration → MBA
    Bachelor of Science → B.Sc.
    Bachelor of Commerce → B.Com
    Doctor of Philosophy → Ph.D.
  Return ONLY the abbreviation. No branch, no university.

university:
  The name of the college/university for the highest qualification.
  Return the institution name only. No city, no year.

skills:
  ALL technical and professional skills mentioned.
  Include: programming languages, frameworks, tools, platforms, soft skills, certifications.
  Return as a JSON array: ["Python", "React", "AWS", "SQL"]
  Be comprehensive — extract every skill mentioned anywhere in the resume.

Return EXACTLY this JSON structure (no extra fields):
{{
    "candidate_name": "",
    "candidate_email": "",
    "candidate_phone": "",
    "current_designation": "",
    "current_company": "",
    "experience_years": "",
    "current_location": "",
    "preferred_location": "",
    "notice_period": "",
    "current_ctc": "",
    "expected_ctc": "",
    "highest_qualification": "",
    "university": "",
    "skills": []
}}

RESUME TEXT:
{text}
"""

_RETRY_PROMPT_TEMPLATE = """\
The following is a resume. Extract information and return ONLY a JSON object with these exact keys:
candidate_name, candidate_email, candidate_phone, current_designation, current_company,
experience_years, experience_years, current_location, preferred_location, notice_period,
current_ctc, expected_ctc, highest_qualification, university, skills (array).

Return ONLY the JSON. Nothing else.

RESUME:
{text}
"""


# ── Parser class ──────────────────────────────────────────────────────────────

class GeminiParser:
    """
    Primary AI-powered resume parser.
    - Runs first when ENABLE_AI_PARSING=true
    - Returns {} on any failure (never raises to caller)
    - Logs field coverage for debugging
    """

    MAX_CHARS = 30_000  # Gemini 2.5 Flash supports 1M tokens; 30K chars ≈ safe budget

    async def parse(self, text: str) -> dict:
        if not settings.enable_ai_parsing:
            return {}
        if not text.strip():
            return {}
        try:
            result = await self._call_gemini(text, _PROMPT_TEMPLATE)
            filled = sum(1 for v in result.values() if v)
            logger.info(f"GeminiParser: {filled}/{len(result)} fields extracted")
            return result
        except json.JSONDecodeError as e:
            logger.warning(f"GeminiParser JSON decode error, retrying: {e}")
            try:
                result = await self._call_gemini(text, _RETRY_PROMPT_TEMPLATE)
                return result
            except Exception as e2:
                logger.warning(f"GeminiParser retry failed: {e2}")
                return {}
        except Exception as e:
            logger.warning(f"GeminiParser failed (non-critical): {e}")
            return {}

    async def _call_gemini(self, text: str, prompt_template: str) -> dict:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = prompt_template.format(text=text[: self.MAX_CHARS])
        response = model.generate_content(prompt)
        cleaned = _clean_gemini_response(response.text)
        return json.loads(cleaned)