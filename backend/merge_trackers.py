import re
from pathlib import Path
from typing import Dict, List

import pandas as pd

# ==========================================================
# CONFIG
# ==========================================================
SOURCE_FOLDER = Path("ATS_sources")
OUTPUT_FILE = Path("master_tracker.xlsx")

MASTER_COLUMNS = [
    "Date", "CreditOwner", "Client", "Candidate Name", "Candidate Email",
    "Candidate No", "Current Company", "Experience [Yrs]", "Current Location",
    "Preferred Location", "Notice Period", "Current CTC", "Expected CTC",
    "Highest Qualification", "University/College", "Skills",
    "Source File", "Source Sheet",
]

COLUMN_ALIASES: Dict[str, str] = {
    # S.No / Record ID (dropped — regenerated at save)
    "s.no": "_DROP", "s no": "_DROP", "sno": "_DROP",
    "s.no.": "_DROP", "sl no": "_DROP", "sl no.": "_DROP",
    "record id": "_DROP",

    # Duplicate status (internal, dropped from final output)
    "duplicate/non duplicate": "_DROP",
    "duplicate / non-duplicate": "_DROP",
    "duplicate/non-duplicate": "_DROP",
    "duplicate status": "_DROP",

    # Alt ID (internal dedup helper, dropped from final output)
    "alt id": "_DROP", "altid": "_DROP",

    # Date
    "date": "Date", "shared on": "Date", "shared": "Date",

    # CreditOwner
    "credit owner": "CreditOwner", "creditowner": "CreditOwner",
    "hr name": "CreditOwner", "recruiter name": "CreditOwner",
    "recruiter": "CreditOwner", "credit_owner": "CreditOwner",

    # Client
    "client": "Client", "client name": "Client",

    # Candidate Name
    "name": "Candidate Name", "candidate name": "Candidate Name",
    "name of candidate": "Candidate Name",
    "candidate": "Candidate Name",

    # Candidate Email
    "email": "Candidate Email", "candidate email": "Candidate Email",
    "email id": "Candidate Email", "e-mail id": "Candidate Email",

    # Candidate No
    "contact no": "Candidate No", "contact no.": "Candidate No",
    "contact number": "Candidate No", "candidate no": "Candidate No",
    "number": "Candidate No", "phone": "Candidate No", "mobile": "Candidate No", "Phone no": "Candidate No",
    "Phone No.": "Candidate No", "Phone": "Candidate No","Mobile No": "Candidate No", "Mobile": "Candidate No",
    "Contact": "Candidate No", "Contact No.": "Candidate No", "Contact Number": "Candidate No",

    # Current Company
    "current organization": "Current Company",
    "current company": "Current Company",
    "organization": "Current Company",
    "current org": "Current Company",

    # Experience
    "total experience": "Experience [Yrs]", "total exp.": "Experience [Yrs]",
    "total exp": "Experience [Yrs]", "experience [yrs]": "Experience [Yrs]",
    "experience": "Experience [Yrs]",

    # CTC
    "current compensation (f +v)": "Current CTC",
    "current compensation (f+v)": "Current CTC",
    "current ctc (f+v)": "Current CTC",
    "current ctc (f +v)": "Current CTC",
    "current ctc": "Current CTC",
    "expected compensation (f)": "Expected CTC",
    "expected ctc (f)": "Expected CTC",
    "expected ctc": "Expected CTC",
    "current ctc (Fixed)": "Current CTC",
    "expected ctc (Fixed)": "Expected CTC",
    "current ctc (Variable)": "Current CTC",
    "expected ctc (Variable)": "Expected CTC",
    "current ctc (F+V)": "Current CTC",
    "expected ctc (F+V)": "Expected CTC",
    "expected ctc (F)": "Expected CTC",

    # Notice / Location
    "notice period": "Notice Period", "notice": "Notice Period",
    "current location": "Current Location",
    "preferred location": "Preferred Location",
    "Notice Period": "Notice Period",

    # Offer / Reason (kept internally but not in final columns → dropped)
    "offer in hand": "_DROP", "holding any offer": "_DROP",
    "reason for job change": "_DROP",

    # Qualification
    "highest qualification": "Highest Qualification",
    "higher qualification": "Highest Qualification",
    "qualification": "Highest Qualification",
    "education": "Highest Qualification",

    # University
    "university": "University/College",
    "university/college": "University/College",
    "college": "University/College",
    "university name": "University/College",

    # Communication / Comments / Source Name → dropped (not in new format)
    "communication rating": "_DROP",
    "communication rating out of 5": "_DROP",
    "comm. rating": "_DROP",
    "comm. rating (out of 5)": "_DROP",
    "rating": "_DROP",
    "comments": "_DROP",
    "source name": "_DROP", "source": "_DROP",

    # Skills  ── role/position also flow into Skills
    "skills": "Skills",
    "skill 1": "Skills", "skill 2": "Skills", "skill 3": "Skills",
    "role": "Skills",           # <── role merged into Skills
    "position": "Skills",       # <── position merged into Skills
    "level": "Skills",          # optional: remove if you don't want level in skills

    # Housekeeping
    "source file": "Source File", "source sheet": "Source Sheet",
}

# ─── header detection tokens ──────────────────────────────────────────────────
HEADER_TOKENS = {
    's.no', 's no', 'sno', 'sl no', 'sl no.', 'record id',
    'duplicate status', 'duplicate/non duplicate', 'duplicate / non-duplicate',
    'duplicate/non-duplicate', 'alt id', 'altid',
    'name','candidate', 'candidate name', 'name of candidate',
    'Contact no', 'Contact No.', 'Contact Number', 'Candidate No',
    'number', 'Phone', 'mobile',
    'email', 'Email id', 'e-mail id', 'Candidate email',
    'level', 'current organization', 'current company', 'organization',
    'current org',
    'total experience', 'total exp.', 'total exp', 'experience',
    'experience [yrs]',
    'current ctc', 'current compensation (f +v)', 'current ctc (f+v)',
    'current compensation (f+v)',
    'expected ctc', 'expected compensation (f)', 'expected ctc (f)',
    'notice period', 'current location', 'preferred location',
    'offer in hand', 'holding any offer',
    'reason for job change',
    'highest qualification', 'higher qualification', 'qualification',
    'Education',
    'university', 'university/college', 'college', 'university name',
    'communication rating', 'communication rating out of 5', 'comm. rating',
    'comm. rating (out of 5)',
    'comments', 'shared on', 'source name', 'source', 'role', 'skills',
    'skill 1', 'skill 2', 'skill 3', 'hr name', 'recruiter name', 'recruiter',
    'source file', 'source sheet',
    'position', 'proposed band', 'open to relocate',
    'status', 'gender', 'date', 'month',
    'credit owner', 'creditowner', 'client', 'client name',
}

BAD_NAME_VALUES = {
    'name', 'candidate', 'candidate name', 'name of candidate',
    'email id', 'e-mail id', 'email',
    'company', 'experience', 'month', 'position', 'contact number', 'contact no',
    'current ctc', 'expected ctc', 'notice period', 'current location', 'skills',
    'role', 'current organization', 'total experience', 'level', 'comments',
    'shared on', 'source name', 'duplicate status', 'alt id',
    'highest qualification', 'higher qualification', 'university',
    'communication rating', 'hr name', 'offer in hand',
    'reason for job change', 's.no', 's no', 'sno', 'sl no',
    'record id', 'source file', 'source sheet', 'date', 'recruiter',
    'recruiter name', 'status', 'gender', 'university name', 'education',
    'phone', 'mobile', 'number', 'qualification', 'source',
    'skill 1', 'skill 2', 'skill 3',
    'credit owner', 'creditowner', 'client', 'client name','credit_owner',
}


# ==========================================================
# HELPERS
# ==========================================================
def normalize_text(value) -> str:
    if pd.isna(value):
        return ""
    text = str(value).strip().lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip(" .\t\n\r")


def normalize_phone(value) -> str:
    if pd.isna(value):
        return ""
    return re.sub(r"\D+", "", str(value))


def canonicalize_columns(columns: List[str]) -> List[str]:
    return [normalize_text(c) for c in columns]


def _cell_is_header_token(value) -> bool:
    return pd.notna(value) and str(value).strip().lower() in HEADER_TOKENS


def is_header_like_row(row: pd.Series) -> bool:
    name_val = str(row.get("Candidate Name", "")).strip().lower() \
        if "Candidate Name" in row.index else ""
    if name_val in BAD_NAME_VALUES:
        return True

    token_hits = sum(_cell_is_header_token(v) for v in row)
    if token_hits >= 4:
        return True

    non_empty = sum(1 for v in row if pd.notna(v) and str(v).strip() != "")
    if non_empty > 0 and token_hits / non_empty >= 0.55:
        return True

    return False


def has_minimum_identity(row: pd.Series) -> bool:
    return any(
        normalize_text(row.get(col, ""))
        for col in ["Candidate Name", "Candidate Email", "Candidate No"]
    )


# ==========================================================
# STEP 2: FIND REAL HEADER ROW
# ==========================================================
def find_and_fix_header(df: pd.DataFrame) -> pd.DataFrame:
    best_row_idx = None
    best_hits = sum(_cell_is_header_token(v) for v in df.iloc[0])

    for i in range(1, min(10, len(df))):
        hits = sum(_cell_is_header_token(v) for v in df.iloc[i])
        if hits > best_hits:
            best_hits = hits
            best_row_idx = i

    if best_row_idx is not None and best_hits >= 3:
        df.columns = [str(v).strip() for v in df.iloc[best_row_idx]]
        df = df.iloc[best_row_idx + 1:].reset_index(drop=True)

    return df


# ==========================================================
# STEP 3: REMOVE JUNK / REPEATED HEADER ROWS
# ==========================================================
def remove_header_like_rows(df: pd.DataFrame) -> pd.DataFrame:
    df = df.dropna(how="all").copy()
    if df.empty:
        return df
    mask = df.apply(is_header_like_row, axis=1)
    return df[~mask].copy()


# ==========================================================
# STEP 4: STANDARDIZE COLUMNS
# ==========================================================
def standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = canonicalize_columns(df.columns)

    # Group source columns by their target field
    mapped_columns: Dict[str, List[str]] = {}
    for col in df.columns:
        target = COLUMN_ALIASES.get(col, col)
        mapped_columns.setdefault(target, []).append(col)

    result = pd.DataFrame(index=df.index)

    for target, source_cols in mapped_columns.items():
        if target == "_DROP":
            continue  # discard columns not in new format

        if target == "Skills":
            # Merge role, position, skill 1/2/3, skills — deduplicated
            def merge_skills(row, cols=source_cols):
                seen: set = set()
                parts: List[str] = []
                for c in cols:
                    val = row[c]
                    if pd.isna(val):
                        continue
                    val = str(val).strip()
                    if not val:
                        continue
                    key = val.lower()
                    if key not in seen:
                        seen.add(key)
                        parts.append(val)
                return ", ".join(parts)

            result[target] = df.apply(merge_skills, axis=1)

        else:
            if len(source_cols) == 1:
                result[target] = df[source_cols[0]]
            else:
                def first_non_empty(row, cols=source_cols):
                    for c in cols:
                        val = row[c]
                        if pd.notna(val) and str(val).strip():
                            return val
                    return ""
                result[target] = df.apply(first_non_empty, axis=1)

    return result


# ==========================================================
# STEP 5: FILL MISSING COLUMNS
# ==========================================================
def fill_missing_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in MASTER_COLUMNS:
        if col not in df.columns:
            df[col] = ""
    return df[MASTER_COLUMNS]


# ==========================================================
# STEP 6: CLEAN ONE SHEET
# ==========================================================
def clean_sheet(df: pd.DataFrame) -> pd.DataFrame:
    df = find_and_fix_header(df)
    df = remove_header_like_rows(df)
    df = standardize_columns(df)

    if "Candidate No" in df.columns:
        df["Candidate No"] = df["Candidate No"].apply(normalize_phone)
    if "Candidate Email" in df.columns:
        df["Candidate Email"] = df["Candidate Email"].apply(normalize_text)
    for col in ["Candidate Name", "Current Company", "Current Location",
                "CreditOwner", "Client"]:
        if col in df.columns:
            df[col] = df[col].apply(normalize_text)

    df = fill_missing_columns(df)
    df = df[df.apply(has_minimum_identity, axis=1)].copy()
    df = df[~df.apply(is_header_like_row, axis=1)].copy()
    return df


# ==========================================================
# STEP 7: MERGE
# ==========================================================
def merge_all_frames(frames: List[pd.DataFrame]) -> pd.DataFrame:
    if not frames:
        return pd.DataFrame(columns=MASTER_COLUMNS)
    return pd.concat(frames, ignore_index=True)


# ==========================================================
# STEP 8: DEDUPE
# ==========================================================
def build_dedupe_key(row: pd.Series) -> str:
    email = normalize_text(row.get("Candidate Email", ""))
    phone = normalize_phone(row.get("Candidate No", ""))
    name  = normalize_text(row.get("Candidate Name", ""))
    org   = normalize_text(row.get("Current Company", ""))
    loc   = normalize_text(row.get("Current Location", ""))

    if email:
        return f"email::{email}"
    if phone:
        return f"phone::{phone}"
    if name and org and loc:
        return f"combo::{name}|{org}|{loc}"
    if name and org:
        return f"combo::{name}|{org}"
    if name:
        return f"name::{name}"
    return f"row::{row.name}"


def deduplicate(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["_dedupe_key"] = df.apply(build_dedupe_key, axis=1)
    duplicate_mask = df.duplicated(subset=["_dedupe_key"], keep="first")
    df = df[~duplicate_mask].copy()
    df = df.drop(columns=["_dedupe_key"], errors="ignore")
    return df


# ==========================================================
# STEP 9: SAVE
# ==========================================================
def save_output(df: pd.DataFrame, output_file: Path) -> None:
    df = df.copy().reset_index(drop=True)
    df.insert(0, "S.No", range(1, len(df) + 1))
    ordered = ["S.No"] + [c for c in MASTER_COLUMNS if c in df.columns]
    ordered = list(dict.fromkeys(ordered))
    df = df[ordered]
    df.to_excel(output_file, index=False)
    print(f"✓  Saved  → {output_file.resolve()}")
    print(f"   Rows   : {len(df)}")


# ==========================================================
# MAIN
# ==========================================================
def main() -> None:
    if not SOURCE_FOLDER.exists():
        raise FileNotFoundError(f"Source folder not found: {SOURCE_FOLDER.resolve()}")

    all_frames = []

    for file in sorted(SOURCE_FOLDER.glob("*.xlsx")):
        try:
            xls = pd.ExcelFile(file)
        except Exception as e:
            print(f"Skipping {file.name}: cannot open Excel file ({e})")
            continue

        for sheet in xls.sheet_names:
            try:
                df = pd.read_excel(file, sheet_name=sheet)
                df = df.dropna(axis=1, how='all')
            except Exception as e:
                print(f"  Skipping sheet {sheet} in {file.name}: {e}")
                continue

            if df.empty:
                continue

            cleaned = clean_sheet(df)
            if cleaned.empty:
                continue

            cleaned["Source File"] = file.name
            cleaned["Source Sheet"] = sheet
            all_frames.append(cleaned)
            print(f"  {file.name} / {sheet} → {len(cleaned)} rows")

    if not all_frames:
        print("No usable Excel data found.")
        return

    master_df = merge_all_frames(all_frames)
    master_df = deduplicate(master_df)
    save_output(master_df, OUTPUT_FILE)


if __name__ == "__main__":
    main()