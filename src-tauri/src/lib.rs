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

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
) -> Result<SalaryInfo, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let amount_str = db::get_setting(&conn, "biweekly_salary").map_err(|e| e.to_string())?;
    let amount = amount_str.parse::<f64>().map_err(|e| e.to_string())?;
    let currency = db::get_setting(&conn, "biweekly_salary_currency").unwrap_or_else(|_| "COP".to_string());
    let frequency = db::get_setting(&conn, "salary_frequency").unwrap_or_else(|_| "quincena".to_string());
    Ok(SalaryInfo { amount, currency, frequency })
}

#[tauri::command]
fn update_salary(
    state: tauri::State<'_, DbState>,
    amount: f64,
    currency: String,
    frequency: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::update_setting(&conn, "biweekly_salary", &amount.to_string()).map_err(|e| e.to_string())?;
    db::update_setting(&conn, "biweekly_salary_currency", &currency).map_err(|e| e.to_string())?;
    db::update_setting(&conn, "salary_frequency", &frequency).map_err(|e| e.to_string())?;
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
            send_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
