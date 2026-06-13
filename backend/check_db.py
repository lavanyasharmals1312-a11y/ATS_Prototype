# check_db.py

import sqlite3

conn = sqlite3.connect("candidates.db")

cursor = conn.cursor()

cursor.execute("SELECT * FROM candidates")

rows = cursor.fetchall()

for row in rows:
    print(row)

conn.close()