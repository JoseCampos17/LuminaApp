use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use std::fs;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransactionView {
    pub id: String,
    pub amount: f64,
    pub category: String,
    pub description: Option<String>,
    pub date: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionPayload {
    pub amount: f64,
    pub category: String,
    pub description: Option<String>,
    pub date: String,
}

pub struct DbState(pub Mutex<Connection>);

pub fn init(app_handle: &AppHandle) -> Result<Connection, Box<dyn std::error::Error>> {
    let app_dir = app_handle.path().app_data_dir()?;
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)?;
    }
    let db_path = app_dir.join("finapp.db");
    let conn = Connection::open(db_path)?;

    // Create events table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS events (
            event_id TEXT PRIMARY KEY,
            aggregate_id TEXT NOT NULL,
            aggregate_type TEXT NOT NULL,
            event_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            hlc TEXT NOT NULL,
            origin_node_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Create indices
    conn.execute("CREATE INDEX IF NOT EXISTS idx_events_hlc ON events(hlc)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_events_aggregate ON events(aggregate_type, aggregate_id)", [])?;

    // Create projection table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS view_transactions (
            id TEXT PRIMARY KEY,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL
        )",
        [],
    )?;

    // Create settings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    // Set default salary if not exists
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('biweekly_salary', '0')",
        [],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('biweekly_salary_currency', 'COP')",
        [],
    )?;

    // Create recurring expenses table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS recurring_expenses (
            id TEXT PRIMARY KEY,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            frequency TEXT NOT NULL, -- 'weekly' or 'monthly'
            day_of_month INTEGER,    -- 1-31 (for monthly)
            day_of_week INTEGER,     -- 0-6 (for weekly, 0=Sun)
            category TEXT NOT NULL
        )",
        [],
    )?;

    Ok(conn)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecurringExpense {
    pub id: String,
    pub amount: f64,
    pub description: String,
    pub frequency: String,
    pub day_of_month: Option<i32>,
    pub day_of_week: Option<i32>,
    pub category: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Event {
    pub event_id: String,
    pub aggregate_id: String,
    pub aggregate_type: String,
    pub event_type: String,
    pub payload: String,
    pub hlc: String,
    pub origin_node_id: String,
}

pub fn get_recurring_expenses(conn: &Connection) -> rusqlite::Result<Vec<RecurringExpense>> {
    let mut stmt = conn.prepare("SELECT id, amount, description, frequency, day_of_month, day_of_week, category FROM recurring_expenses")?;
    let rows = stmt.query_map([], |row| {
        Ok(RecurringExpense {
            id: row.get(0)?,
            amount: row.get(1)?,
            description: row.get(2)?,
            frequency: row.get(3)?,
            day_of_month: row.get(4)?,
            day_of_week: row.get(5)?,
            category: row.get(6)?,
        })
    })?;

    let mut list = Vec::new();
    for row in rows {
        list.push(row?);
    }
    Ok(list)
}

pub fn insert_recurring_expense(conn: &Connection, expense: &RecurringExpense) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO recurring_expenses (id, amount, description, frequency, day_of_month, day_of_week, category)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            expense.id,
            expense.amount,
            expense.description,
            expense.frequency,
            expense.day_of_month,
            expense.day_of_week,
            expense.category
        ],
    )?;
    Ok(())
}

pub fn delete_recurring_expense(conn: &Connection, id: &str) -> rusqlite::Result<()> {
    conn.execute("DELETE FROM recurring_expenses WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn get_setting(conn: &Connection, key: &str) -> rusqlite::Result<String> {
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        params![key],
        |row| row.get(0),
    )
}

pub fn update_setting(conn: &Connection, key: &str, value: &str) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        params![key, value],
    )?;
    Ok(())
}

pub fn insert_event(conn: &Connection, event: &Event) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT INTO events (event_id, aggregate_id, aggregate_type, event_type, payload, hlc, origin_node_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            event.event_id,
            event.aggregate_id,
            event.aggregate_type,
            event.event_type,
            event.payload,
            event.hlc,
            event.origin_node_id
        ],
    )?;

    // PROJECTION LOGIC: If it's a transaction, update the view_transactions table
    if event.event_type == "TRANSACTION_CREATED" {
        if let Ok(payload) = serde_json::from_str::<TransactionPayload>(&event.payload) {
            conn.execute(
                "INSERT OR REPLACE INTO view_transactions (id, amount, category, description, date)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![
                    event.aggregate_id,
                    payload.amount,
                    payload.category,
                    payload.description,
                    payload.date
                ],
            )?;
        }
    }

    Ok(())
}

pub fn get_transactions(conn: &Connection) -> rusqlite::Result<Vec<TransactionView>> {
    let mut stmt = conn.prepare("SELECT id, amount, category, description, date FROM view_transactions ORDER BY date DESC")?;
    let rows = stmt.query_map([], |row| {
        Ok(TransactionView {
            id: row.get(0)?,
            amount: row.get(1)?,
            category: row.get(2)?,
            description: row.get(3)?,
            date: row.get(4)?,
        })
    })?;

    let mut txs = Vec::new();
    for row in rows {
        txs.push(row?);
    }
    Ok(txs)
}

/// Delete a transaction by its aggregate_id from both the view table and the events log.
pub fn delete_transaction(conn: &Connection, id: &str) -> rusqlite::Result<()> {
    conn.execute("DELETE FROM view_transactions WHERE id = ?1", params![id])?;
    conn.execute("DELETE FROM events WHERE aggregate_id = ?1", params![id])?;
    Ok(())
}

/// Update a transaction's fields in the view_transactions projection table.
pub fn update_transaction(
    conn: &Connection,
    id: &str,
    amount: f64,
    category: &str,
    description: &str,
    date: &str,
) -> rusqlite::Result<()> {
    conn.execute(
        "UPDATE view_transactions SET amount = ?1, category = ?2, description = ?3, date = ?4 WHERE id = ?5",
        params![amount, category, description, date, id],
    )?;
    Ok(())
}
