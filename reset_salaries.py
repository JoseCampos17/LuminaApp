import sqlite3, os
p1 = r'C:\Users\USER\AppData\Roaming\com.shin.lumina\finapp.db'
p2 = r'C:\Users\USER\AppData\Local\com.shin.lumina\finapp.db'
db_path = p1 if os.path.exists(p1) else p2 if os.path.exists(p2) else None

if not db_path:
    print('No DB found.')
    exit(1)

with sqlite3.connect(db_path) as db:
    db.execute("DELETE FROM salary_history")
    db.execute("INSERT INTO salary_history (amount, currency, frequency, effective_date) VALUES (10000.0, 'COP', 'quincena', '2026-01-01')")
    db.execute("INSERT INTO salary_history (amount, currency, frequency, effective_date) VALUES (12000.0, 'COP', 'quincena', '2026-02-01')")
    # Also reset the legacy settings back to 0 just in case
    db.execute("UPDATE settings SET value = '0' WHERE key = 'biweekly_salary'")
    db.commit()
    print('Wiped and inserted clean dummy salaries for Jan and Feb.')
