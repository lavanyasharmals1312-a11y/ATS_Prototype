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
You are an ATS resume parser.

Extract information from this resume.

Return ONLY valid JSON.

{{
  "candidate_name":"",
  "candidate_email":"",
  "candidate_phone":"",
  "current_company":"",
  "experience_years":"",
  "current_location":"",
  "preferred_location":"",
  "notice_period":"",
  "current_ctc":"",
  "expected_ctc":"",
  "highest_qualification":"",
  "university":"",
  "skills":[]
}}

If a value is not present, return "".

Do not hallucinate.
Do not infer information.
Return only valid JSON.

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


