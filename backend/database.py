import sqlite3


def create_database():

    conn = sqlite3.connect("candidates.db")

    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS candidates(

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        candidate_name TEXT,

        candidate_email TEXT UNIQUE,

        candidate_phone TEXT,

        current_company TEXT,

        experience_years TEXT,

        current_location TEXT,

        preferred_location TEXT,

        notice_period TEXT,

        current_ctc TEXT,

        expected_ctc TEXT,

        highest_qualification TEXT,

        university TEXT,

        skills TEXT,

        resume_file_name TEXT,

        parsed_on_date TEXT
    )
    """)

    conn.commit()
    conn.close()


def candidate_exists(email):

    if not email:
        return False

    conn = sqlite3.connect("candidates.db")

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id
        FROM candidates
        WHERE candidate_email = ?
        """,
        (email,)
    )

    result = cursor.fetchone()

    conn.close()

    return result is not None


def insert_candidate(data):

    email = (
        data.get("candidate_email", "")
        .strip()
        .lower()
    )

    if candidate_exists(email):

        print(
            f"Duplicate candidate skipped: {email}"
        )

        return

    conn = sqlite3.connect("candidates.db")

    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO candidates(

        candidate_name,

        candidate_email,

        candidate_phone,

        current_company,

        experience_years,

        current_location,

        preferred_location,

        notice_period,

        current_ctc,

        expected_ctc,

        highest_qualification,

        university,

        skills,

        resume_file_name,

        parsed_on_date

    )

    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)

    """,

    (

        data.get("candidate_name", ""),

        email,

        data.get("candidate_phone", ""),

        data.get("current_company", ""),

        str(data.get("experience_years", "")),

        data.get("current_location", ""),

        data.get("preferred_location", ""),

        data.get("notice_period", ""),

        data.get("current_ctc", ""),

        data.get("expected_ctc", ""),

        data.get("highest_qualification", ""),

        data.get("university", ""),

        ",".join(data.get("skills", [])),

        data.get("resume_file_name", ""),

        data.get("parsed_on_date", "")

    ))

    conn.commit()

    conn.close()

    print(
        f"Inserted candidate: {email}"
    )


if __name__ == "__main__":

    create_database()

    print(
        "Database and table created successfully."
    )