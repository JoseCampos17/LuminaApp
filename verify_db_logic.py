import sqlite3
import os
import datetime

def get_db_path():
    p1 = r'C:\Users\USER\AppData\Roaming\com.shin.lumina\finapp.db'
    p2 = r'C:\Users\USER\AppData\Local\com.shin.lumina\finapp.db'
    if os.path.exists(p1): return p1
    if os.path.exists(p2): return p2
    return None

db_path = get_db_path()
if not db_path:
    print("Database not found!")
    exit(1)

with sqlite3.connect(db_path) as conn:
    # 0. Show current state
    print("--- Current Database records in salary_history: ---")
    for row in conn.execute("SELECT * FROM salary_history ORDER BY effective_date"):
        print(row)

    # 1. Simulate get_salary for January (month=0, year=2026)
    period_boundary_jan = "2026-01-31"
    cur = conn.cursor()
    cur.execute(f"SELECT amount, effective_date FROM salary_history WHERE effective_date <= '{period_boundary_jan}' ORDER BY effective_date DESC, id DESC LIMIT 1")
    jan_result = cur.fetchone()
    print(f"\n--- Simulated get_salary for January 2026 (<= {period_boundary_jan}) ---")
    if jan_result:
        print(f"Result: {jan_result[0]} COP (effective since {jan_result[1]})")
    else:
        print("Result: 0 COP (No record found)")

    # 2. Simulate update_salary executed TODAY (e.g. March 2026)
    today = datetime.date.today().strftime("%Y-%m-%d")
    print(f"\n--- Simulating update_salary with 77777 COP TODAY ({today}) ---")
    exists = conn.execute(f"SELECT EXISTS(SELECT 1 FROM salary_history WHERE effective_date = '{today}')").fetchone()[0]
    if exists:
        conn.execute(f"UPDATE salary_history SET amount = 77777.0 WHERE effective_date = '{today}'")
    else:
        conn.execute(f"INSERT INTO salary_history (amount, currency, frequency, effective_date) VALUES (77777.0, 'COP', 'quincena', '{today}')")
    conn.commit()

    # 3. Verify January AGAIN after the update
    cur.execute(f"SELECT amount, effective_date FROM salary_history WHERE effective_date <= '{period_boundary_jan}' ORDER BY effective_date DESC, id DESC LIMIT 1")
    jan_after = cur.fetchone()
    print(f"\n--- Simulated get_salary for January 2026 AGAIN ---")
    if jan_after:
        print(f"Result: {jan_after[0]} COP (effective since {jan_after[1]})")
    else:
        print("Result: 0 COP")

    # 4. Verify March (today)
    period_boundary_mar = "2026-03-31"
    cur.execute(f"SELECT amount, effective_date FROM salary_history WHERE effective_date <= '{period_boundary_mar}' ORDER BY effective_date DESC, id DESC LIMIT 1")
    mar_after = cur.fetchone()
    print(f"\n--- Simulated get_salary for March 2026 ---")
    if mar_after:
        print(f"Result: {mar_after[0]} COP (effective since {mar_after[1]})")

    print("\n--- Final Database records in salary_history: ---")
    for row in conn.execute("SELECT * FROM salary_history ORDER BY effective_date"):
        print(row)
