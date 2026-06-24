import streamlit as st
import sqlite3
import pandas as pd

st.title("Candidate Database")

conn = sqlite3.connect("../candidates.db")

df = pd.read_sql_query(
    "SELECT * FROM candidates",
    conn
)

conn.close()

st.dataframe(
    df,
    use_container_width=True
)