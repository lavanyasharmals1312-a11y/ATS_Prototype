import streamlit as st
import sqlite3
import pandas as pd

st.title("Talent Search")

skill = st.text_input("Skill")

if st.button("Search"):

    conn = sqlite3.connect("../candidates.db")

    query = """
    SELECT *
    FROM candidates
    WHERE skills LIKE ?
    """

    df = pd.read_sql_query(
        query,
        conn,
        params=[f"%{skill}%"]
    )

    conn.close()

    st.dataframe(
        df,
        use_container_width=True
    )