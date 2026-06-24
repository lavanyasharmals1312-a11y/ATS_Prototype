import streamlit as st

st.title("Resume Upload")

uploaded_file = st.file_uploader(
    "Upload Resume",
    type=["pdf", "docx"]
)

if uploaded_file:

    st.success(
        f"{uploaded_file.name} uploaded successfully."
    )

    st.info(
        "Resume parsing pipeline will be connected here."
    )