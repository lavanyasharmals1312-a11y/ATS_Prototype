import streamlit as st
import os
import sys
import tempfile

# Allow importing backend modules
sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../backend")
    )
)

from extractor import extract_pdf, extract_docx
from gemini_parser import parse_resume
from excel_writer import append_candidate

st.set_page_config(page_title="Resume Upload", layout="wide")

st.title("Resume Upload")

st.write(
    "Upload a candidate resume to automatically extract and store information."
)

uploaded_file = st.file_uploader(
    "Choose Resume",
    type=["pdf", "docx"]
)

if uploaded_file:

    suffix = ".pdf" if uploaded_file.name.lower().endswith(".pdf") else ".docx"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(uploaded_file.getbuffer())
        temp_path = tmp.name

    st.success("Resume uploaded successfully!")

    with st.spinner("Extracting text..."):

        if uploaded_file.name.lower().endswith(".pdf"):
            text = extract_pdf(temp_path)
        else:
            text = extract_docx(temp_path)

    st.success("Text extracted!")

    st.subheader("Extracted Resume Text")

    st.text_area(
        "",
        text,
        height=250
    )

    if st.button("Parse Resume"):

        with st.spinner("Gemini is analysing the resume..."):

            candidate = parse_resume(text)

        st.success("Resume parsed successfully!")

        st.subheader("Candidate Information")

        st.json(candidate)

        # Store candidate in Excel
        excel_path = append_candidate(candidate)

        st.success(f"Candidate stored successfully!")

        st.write("Excel saved at:")

        st.code(excel_path)

        # Delete temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)