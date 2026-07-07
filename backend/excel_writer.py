import os
from openpyxl import Workbook, load_workbook

EXCEL_FILE = "Master_Tracker_Gemini.xlsx"

HEADERS = [
    "S.No",
    "Record ID",
    "Duplicate Status",
    "Alt ID",
    "Name",
    "Contact No",
    "Email",
    "Level",
    "Current Organization",
    "Total Experience",
    "Current CTC",
    "Expected CTC",
    "Notice Period",
    "Current Location",
    "Preferred Location",
    "Offer in Hand",
    "Reason for Job Change",
    "Highest Qualification",
    "University",
    "Communication Rating",
    "Comments",
    "Shared On",
    "Source Name",
    "Role",
    "Skills",
    "HR Name"
]


def append_candidate(candidate):

    if os.path.exists(EXCEL_FILE):
        wb = load_workbook(EXCEL_FILE)
        ws = wb.active
    else:
        wb = Workbook()
        ws = wb.active
        ws.append(HEADERS)

    sno = ws.max_row

    skills = candidate.get("skills", "")

    if isinstance(skills, list):
        skills = ", ".join(skills)

    ws.append([
        sno,
        "",
        "",
        "",
        candidate.get("name", ""),
        candidate.get("phone", ""),
        candidate.get("email", ""),
        candidate.get("level", ""),
        candidate.get("current_organization", ""),
        candidate.get("experience", ""),
        candidate.get("current_ctc", ""),
        candidate.get("expected_ctc", ""),
        candidate.get("notice_period", ""),
        candidate.get("current_location", ""),
        candidate.get("preferred_location", ""),
        candidate.get("offer_in_hand", ""),
        candidate.get("reason_for_job_change", ""),
        candidate.get("highest_qualification", ""),
        candidate.get("university", ""),
        "",
        "",
        "",
        "",
        candidate.get("role", ""),
        skills,
        ""
    ])

    wb.save(EXCEL_FILE)
    print(f"Saved Excel at: {os.path.abspath(EXCEL_FILE)}")
    return os.path.abspath(EXCEL_FILE)