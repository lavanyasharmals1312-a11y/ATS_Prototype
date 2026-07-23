import json
from loguru import logger
from app.services.protocols import ResumeParser
from app.config import settings


def _clean_gemini_response(raw: str) -> str:
    """
    Strip markdown code fences that Gemini sometimes wraps JSON in.
    Standalone function — composable, not inherited.
    """
    cleaned = raw.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


class GeminiParser:
    """
    Implements ResumeParser protocol.
    Optional AI layer — disabled by default.
    Returns {} on ANY failure. Never raises to caller.
    AI only fills fields rule_parser left empty.
    """

    PROMPT_TEMPLATE = """
    You are an expert ATS Resume Parser.
    Extract information from the resume and return ONLY valid JSON.

    IMPORTANT RULES:
    - Return ONLY JSON. No markdown, no explanations.
    - If a field is not mentioned, return empty string "".
    - Do NOT hallucinate information.
    - Skills MUST be a JSON array.
    - Experience: total years numeric only (e.g. 1.6, 5, 10.5).
    - Current Designation: most recent job title only.
    - Current Location: current city only (not university, not preferred).
    - Highest Qualification: abbreviation only (B.Tech, MBA, M.Sc.).

    Return EXACTLY this JSON:
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

    Resume:
    {text}
    """

    async def parse(self, text: str) -> dict:
        """
        Returns parsed dict or {} on any failure.
        Caller must never depend on this succeeding.
        """
        if not settings.enable_ai_parsing:
            return {}
        if not text.strip():
            return {}
        try:
            return await self._call_gemini(text)
        except Exception as e:
            logger.warning(f"GeminiParser failed (non-critical): {e}")
            return {}

    async def _call_gemini(self, text: str) -> dict:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = self.PROMPT_TEMPLATE.format(text=text[:8000])
        response = model.generate_content(prompt)
        cleaned = _clean_gemini_response(response.text)
        return json.loads(cleaned)