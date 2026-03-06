# Backend – Tauri Commands & Database

## Architecture

- **Rust** via Tauri v2; single `DbState(Mutex<Connection>)` shared across commands.
- **SQLite** stored at the OS app-data dir (`finapp.db`).
- **Event Sourcing light**: transactions are appended as events → projected into `view_transactions` read model.

## Database Tables

```sql
-- Event log (append-only)
events(event_id PK, aggregate_id, aggregate_type, event_type, payload JSON, hlc, origin_node_id, created_at)
-- Projection: fast query target
view_transactions(id PK, amount REAL, category TEXT, description TEXT, date TEXT)
-- Key/value config
settings(key PK, value TEXT)
-- Recurring bills
recurring_expenses(id PK, amount REAL, description TEXT, frequency TEXT, day_of_month INT, day_of_week INT, category TEXT)
```

## Settings Keys

| Key                        | Default | Description                                                 |
| -------------------------- | ------- | ----------------------------------------------------------- |
| `biweekly_salary`          | `"0"`   | Biweekly salary amount **always in USD**                    |
| `biweekly_salary_currency` | `"COP"` | Denomination the user entered the salary in (informational) |

## All Tauri Commands (`lib.rs`)

| Command                    | Args                                      | Returns                           | Purpose                                            |
| -------------------------- | ----------------------------------------- | --------------------------------- | -------------------------------------------------- |
| `get_salary`               | —                                         | `{amount: f64, currency: String}` | Reads salary + currency from settings              |
| `update_salary`            | `amount: f64, currency: String`           | `()`                              | Saves salary + currency; **amount must be in USD** |
| `get_transactions`         | —                                         | `TransactionView[]`               | All transactions ordered by date DESC              |
| `add_event`                | `event: Event`                            | `()`                              | Append event; auto-projects TRANSACTION_CREATED    |
| `delete_transaction`       | `id: String`                              | `()`                              | Removes from view_transactions + events            |
| `update_transaction`       | `id, amount, category, description, date` | `()`                              | Updates view_transactions directly                 |
| `get_recurring_expenses`   | —                                         | `RecurringExpense[]`              | All recurring expenses                             |
| `add_recurring_expense`    | `expense: RecurringExpense`               | `()`                              | Upsert recurring expense                           |
| `delete_recurring_expense` | `id: String`                              | `()`                              | Delete by id                                       |
| `send_notification`        | `title: String, body: String`             | `()`                              | Local push notification (no internet)              |

## Tauri Plugins Used

- `tauri-plugin-opener`
- `tauri-plugin-notification`
- `tauri-plugin-log`

## Browser Mock (`src/lib/tauri.ts`)

When running in a plain browser (not Tauri), `invoke()` uses `localStorage` to simulate backend responses. The mock detects Tauri via `window.__TAURI_INTERNALS__`. If you add a new Tauri command, you must also add a mock case in `tauri.ts`.

## Adding a New Tauri Command

1. Add Rust function in `lib.rs` with `#[tauri::command]`
2. Register it in `tauri::generate_handler![...]`
3. Add a mock in the `switch(command)` block in `tauri.ts`
