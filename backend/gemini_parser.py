import json
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()


API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")


def parse_resume(text):

    prompt = f"""
You are an expert ATS Resume Parser.

Extract every field below from the resume.

IMPORTANT RULES:
- Return ONLY valid JSON.
- Do not include markdown.
- Do not explain anything.
- If a field is missing, return an empty string "".
- Never hallucinate.
- Skills should ALWAYS be a JSON array.
- Experience should be only the numeric years (e.g. 3.5, 8, 12).
- Current designation means the candidate's latest job title.
- Current company means the employer corresponding to the latest designation.
- Highest qualification should contain only the degree.
- University should contain only the university/college.
- Level should be inferred from the designation if possible (Intern, Associate, Software Engineer, Senior Engineer, Lead, Manager, Architect, Principal, Director, etc.)

Return EXACTLY this JSON format:

{{
"candidate_name":"",
"candidate_email":"",
"candidate_phone":"",
"current_designation":"",
"level":"",
"current_company":"",
"experience_years":"",
"current_location":"",
"preferred_location":"",
"notice_period":"",
"current_ctc":"",
"expected_ctc":"",
"offer_in_hand":"",
"reason_for_job_change":"",
"highest_qualification":"",
"university":"",
"skills":[]
}}

Resume:

{text}
"""

    response = model.generate_content(prompt)

    cleaned = response.text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "")
        cleaned = cleaned.replace("```", "")
        cleaned = cleaned.strip()

    return json.loads(cleaned)


