import os
from datetime import datetime
from extractor import extract_pdf, extract_docx
from gemini_parser import parse_resume
from database import insert_candidate

RESUME_FOLDER = "resumes"

for file in os.listdir(RESUME_FOLDER):

    path = os.path.join(RESUME_FOLDER, file)

    print("=" * 50)
    print("Processing:", file)

    try:

        # Extract text
        if file.lower().endswith(".pdf"):
            text = extract_pdf(path)

        elif file.lower().endswith(".docx"):
            text = extract_docx(path)

        else:
            print("Skipped unsupported file:", file)
            continue

        if not text.strip():
            print("No text extracted.")
            continue

        # Gemini parsing
        candidate = parse_resume(text)

        candidate["resume_file_name"] = file

        candidate["parsed_on_date"] = (
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )

        insert_candidate(candidate)

        print("Saved to database successfully.")

    except Exception as e:
        print(f"Error processing {file}:")
        print(e)

    print("=" * 50)