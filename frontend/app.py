import streamlit as st

st.set_page_config(
    page_title="ATS Prototype",
    page_icon="📄",
    layout="wide"
)

st.title("AI-Powered ATS")

st.markdown("""
### Recruitment Intelligence Dashboard

Manage candidate profiles, search talent, and process resumes through AI-powered extraction.

---

### Features

- Resume Parsing
- Candidate Database
- Skill-Based Search
- Experience Filtering
- Location Filtering
- Resume Upload Pipeline
""")

col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Candidates", "1")

with col2:
    st.metric("Skills Indexed", "50+")

with col3:
    st.metric("Status", "Active")

st.info("Use the sidebar to navigate through the ATS.")