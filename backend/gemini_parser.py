import json
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()


API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-flash-latest")


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
    -Current Designation:
        Extract the candidate's MOST RECENT job title.

        This is usually the designation associated with the latest work experience.

        Examples:
        - Software Engineer
        - Senior Software Engineer
        - Associate Consultant
        - Data Scientist
        - AI Engineer
        - Backend Developer
        - Technical Architect
        - Team Lead
        - Manager

        Do NOT return department names.
        Do NOT return company names.
        Return ONLY the designation.
        - Current Location:
        Extract the candidate's CURRENT location.

        Search the resume in this order:

        1. "Current Location"
        2. "Location"
        3. "Present Location"
        4. "Address"
        5. Header beside phone/email
        6. Location beside the latest company

        Ignore:
        - Preferred Location
        - Previous work locations
        - University location

        Examples:
        Bengaluru
        Noida
        Hyderabad
        Pune, Maharashtra

        Return only the current city (or city, state).
        -Highest Qualification:
        Return ONLY the highest degree.

        Examples:

        Bachelor of Technology -> B.Tech
        Bachelor of Engineering -> B.E.
        Master of Technology -> M.Tech
        Master of Science -> M.Sc.
        Master of Business Administration -> MBA

        Do not include branch.
        Do not include university.
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
    try:
        return json.loads(cleaned)
    except Exception as e:
        print(cleaned)
        raise e
        return json.loads(cleaned)


