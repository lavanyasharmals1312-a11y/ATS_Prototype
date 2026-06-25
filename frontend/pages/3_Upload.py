import streamlit as st
import os
import sys

# Allow importing backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from extractor import extract_pdf, extract_docx
from gemini_parser import parse_resume
from database import insert_candidate

st.set_page_config(page_title="Resume Upload", layout="wide")

st.title("Resume Upload")

st.write("Upload a candidate resume to automatically extract and store information.")

uploaded_file = st.file_uploader(
    "Choose Resume",
    type=["pdf", "docx"]
)

if uploaded_file:

    import tempfile

    suffix = ".pdf" if uploaded_file.name.lower().endswith(".pdf") else ".docx"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(uploaded_file.getbuffer())
        temp_path = tmp.name

    st.success("Resume uploaded successfully!")

    with st.spinner("Extracting text..."):

        if uploaded_file.name.endswith(".pdf"):
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

        insert_candidate(candidate)

        st.success("Candidate stored successfully!")