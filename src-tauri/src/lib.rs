mod db;

use db::{DbState, Event};
use tauri::Manager;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
 
 #[derive(Serialize, Deserialize)]
 pub struct SalaryInfo {
     pub amount: f64,
     pub currency: String,
     pub frequency: String,
 }

 #[derive(Serialize, Deserialize)]
 pub struct SalaryRecord {
     pub id: i32,
     pub amount: f64,
     pub currency: String,
     pub frequency: String,
     pub effective_date: String,
 }

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_salary_history(
    state: tauri::State<'_, DbState>,
) -> Result<Vec<SalaryRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, amount, currency, frequency, effective_date FROM salary_history ORDER BY effective_date DESC, id DESC")
        .map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map([], |row| {
        Ok(SalaryRecord {
            id: row.get(0)?,
            amount: row.get(1)?,
            currency: row.get(2)?,
            frequency: row.get(3)?,
            effective_date: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for row in rows {
        list.push(row.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
fn delete_salary_record(
    state: tauri::State<'_, DbState>,
    id: i32,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM salary_history WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn add_event(
    state: tauri::State<'_, DbState>,
    event: Event,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::insert_event(&conn, &event).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_transactions(
    state: tauri::State<'_, DbState>,
) -> Result<Vec<db::TransactionView>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::get_transactions(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_salary(
    state: tauri::State<'_, DbState>,
    month: Option<i32>,
    year: Option<i32>,
) -> Result<SalaryInfo, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    
    // REQUIREMENT: Carry-over from previous months.
    // If month/year provided, find the most recent salary effective BEFORE or AT THE END of that period.
    let query = if let (Some(m), Some(y)) = (month, year) {
        // We find the last day of the month to define the search boundary.
        // This ensures that a record updated on the 15th of February is still caught when viewing February.
        let m_idx = m as usize;
        let leap = (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0);
        let month_days = if leap {
            [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        } else {
            [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        };
        let day = month_days[m_idx];
        let period_boundary = format!("{:04}-{:02}-{:02}", y, m + 1, day);
        
        format!(
            "SELECT amount, currency, frequency FROM salary_history 
             WHERE effective_date <= '{}' 
             ORDER BY effective_date DESC, id DESC LIMIT 1",
            period_boundary
        )
    } else {
        "SELECT amount, currency, frequency FROM salary_history ORDER BY effective_date DESC, id DESC LIMIT 1".to_string()
    };

    let res = conn.query_row(&query, [], |row| {
        Ok(SalaryInfo {
            amount: row.get(0)?,
            currency: row.get(1)?,
            frequency: row.get(2)?,
        })
    });

    match res {
        Ok(info) => {
            println!("[Rust] get_salary SUCCESS: {} {}", info.amount, info.currency);
            Ok(info)
        },
        Err(e) => {
            println!("[Rust] get_salary NOT FOUND (query: {}), error: {:?}. Returning 0.", query, e);
            // If no record exists even in the absolute past, it defaults to 0.
            Ok(SalaryInfo { 
                amount: 0.0, 
                currency: "USD".to_string(), 
                frequency: "quincena".to_string() 
            })
        }
    }
}

#[tauri::command]
fn update_salary(
    state: tauri::State<'_, DbState>,
    amount: f64,
    currency: String,
    frequency: String,
    month: Option<i32>,
    year: Option<i32>,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    
    // 1. Update legacy settings (for backward compatibility/simplicity)
    db::update_setting(&conn, "biweekly_salary", &amount.to_string()).map_err(|e| e.to_string())?;
    db::update_setting(&conn, "biweekly_salary_currency", &currency).map_err(|e| e.to_string())?;
    db::update_setting(&conn, "salary_frequency", &frequency).map_err(|e| e.to_string())?;

    // 2. Add or Update record for the specific month (Effective on the 1st)
    // If no month/year provided (fallback), use today's.
    let effective_date = if let (Some(m), Some(y)) = (month, year) {
        format!("{:04}-{:02}-01", y, m + 1)
    } else {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        db::format_date_from_secs(now)
    };
    
    // Check if a record already exists for THIS EXACT DATE
    let exists: bool = conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM salary_history WHERE effective_date = ?1)",
        rusqlite::params![effective_date],
        |row| row.get(0)
    ).unwrap_or(false);

    if exists {
        conn.execute(
            "UPDATE salary_history SET amount = ?1, currency = ?2, frequency = ?3 WHERE effective_date = ?4",
            rusqlite::params![amount, currency, frequency, effective_date],
        ).map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO salary_history (amount, currency, frequency, effective_date) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![amount, currency, frequency, effective_date],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn get_recurring_expenses(
    state: tauri::State<'_, DbState>,
) -> Result<Vec<db::RecurringExpense>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::get_recurring_expenses(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_recurring_expense(
    state: tauri::State<'_, DbState>,
    expense: db::RecurringExpense,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::insert_recurring_expense(&conn, &expense).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_recurring_expense(
    state: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::delete_recurring_expense(&conn, &id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_transaction(
    state: tauri::State<'_, DbState>,
    id: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::delete_transaction(&conn, &id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn clear_all_data(
    state: tauri::State<'_, db::DbState>,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::clear_all_data(&conn).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn update_transaction(
    state: tauri::State<'_, DbState>,
    id: String,
    amount: f64,
    category: String,
    description: String,
    date: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::update_transaction(&conn, &id, amount, &category, &description, &date).map_err(|e| e.to_string())?;
    Ok(())
}

/// Sends a local device notification (no internet, no Firebase).
/// Called from the Svelte frontend when spending patterns look risky.
#[tauri::command]
async fn send_notification(app: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn debug_dump_db(state: tauri::State<'_, DbState>) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT * FROM salary_history").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(format!(
            "ID: {}, Amt: {}, Curr: {}, Freq: {}, Date: {}",
            row.get::<_, i32>(0)?,
            row.get::<_, f64>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, String>(4)?
        ))
    }).map_err(|e| e.to_string())?;
    
    let mut result = String::from("--- SALARY HISTORY ---\n");
    for row in rows {
        result.push_str(&row.map_err(|e| e.to_string())?);
        result.push('\n');
    }
    
    result.push_str("\n--- SETTINGS ---\n");
    let mut stmt = conn.prepare("SELECT * FROM settings").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(format!("{}: {}", row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    }).map_err(|e| e.to_string())?;
    for row in rows {
        result.push_str(&row.map_err(|e| e.to_string())?);
        result.push('\n');
    }
    
    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .setup(|app| {
            let conn = db::init(app.handle())?;
            app.manage(DbState(Mutex::new(conn)));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet, 
            add_event, 
            get_transactions, 
            get_salary, 
            update_salary,
            get_recurring_expenses,
            add_recurring_expense,
            delete_recurring_expense,
            delete_transaction,
            update_transaction,
            clear_all_data,
            send_notification,
            get_salary_history,
            delete_salary_record,
            debug_dump_db
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
