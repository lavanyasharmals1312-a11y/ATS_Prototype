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

    Extract information from the resume and return ONLY valid JSON.

    IMPORTANT RULES:
    - Return ONLY JSON.
    - Do NOT include markdown or explanations.
    - If a field is not mentioned, return an empty string "".
    - Do NOT hallucinate information.
    - Skills must ALWAYS be returned as a JSON array.
    - Experience should be returned as the total years of experience (numeric only, e.g. 1.6, 5, 10.5).
    - Current Company should be the candidate's latest employer.
    - Current Designation should be the latest job title.
    - Current Location should be the candidate's present city/state where they currently live or work. Do NOT use preferred location or university location.
    - Highest Qualification should only contain the degree (e.g. B.Tech, M.Tech, MBA).
    - University should contain the university/college name only.

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

    response = model.generate_content(prompt)

    cleaned = response.text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "")
        cleaned = cleaned.replace("```", "")
        cleaned = cleaned.strip()

    return json.loads(cleaned)


