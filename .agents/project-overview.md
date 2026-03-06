# Lumina – Project Overview

**Type**: Personal Finance App (Tauri + Svelte + Rust + SQLite)  
**Stack**: SvelteKit (frontend) · Tauri v2 (desktop/mobile shell) · Rust (backend logic) · SQLite via rusqlite

## What It Does

- Dashboard showing biweekly/monthly **net income, variable expenses, liquidity %**
- **Transaction** tracking (add, edit-latest, delete-latest)
- **Recurring expenses** (weekly/monthly) that reduce available income
- **Savings Projection** modal (🚀 FAB, bottom-left)
- **Multi-currency** support: USD, COP, CLP (configurable rates, persisted in localStorage)
- **Dark / Light theme** toggle (moved into Settings modal)
- **Local push notifications** for spending alerts (no internet)
- Android APK via `tauri android build`

## Directory Map

```
finapp/
├── src/
│   ├── app.css              — global CSS variables + base styles
│   ├── app.html             — root HTML shell
│   ├── routes/+page.svelte  — main (only) page: dashboard, all state, all modals
│   └── lib/
│       ├── currencies.ts        — multi-currency core (conversions + formatting)
│       ├── tauri.ts             — invoke() wrapper + browser mocks via localStorage
│       ├── Modal.svelte         — generic modal wrapper
│       ├── ThemeToggle.svelte   — light/dark toggle (inside Settings modal)
│       ├── CurrencyToggle.svelte— top-nav toggle: [localCurrency, USD]
│       ├── CurrencyRates.svelte — settings panel: edit exchange rates
│       ├── SalaryConfig.svelte  — settings panel: set biweekly salary
│       ├── RecurringExpenses.svelte — settings panel: manage recurring costs
│       ├── TransactionForm.svelte   — add transaction form (modal)
│       ├── FinancialInsights.svelte — smart spending analysis card
│       └── SavingsSimulator.svelte  — savings projection UI
└── src-tauri/
    └── src/
        ├── main.rs    — entry point (calls lib::run)
        ├── lib.rs     — all Tauri commands (#[tauri::command])
        ├── db.rs      — SQLite schema + CRUD helpers
        └── sync.rs    — placeholder for P2P sync engine (not yet active)
```

## localStorage Keys (browser / dev mode)

| Key                     | Purpose                                               |
| ----------------------- | ----------------------------------------------------- |
| `lumina_local_currency` | User's chosen local currency (COP or CLP)             |
| `lumina_currency_rates` | Custom exchange rates (JSON: `{COP: 4000, CLP: 940}`) |
| `lumina-theme`          | "dark" or "light"                                     |
| `lumina_onboarded`      | "true" if tutorial was completed                      |
| `mock_salary`           | Browser mock: salary amount in USD                    |
| `mock_salary_currency`  | Browser mock: salary currency (always "USD")          |
| `mock_transactions`     | Browser mock: array of transactions                   |
| `mock_recurring`        | Browser mock: recurring expenses array                |

## Running Locally

```bash
npm run dev      # starts Vite dev server on :1420
npm run tauri dev   # starts Tauri desktop app in dev mode
```

## Important UX Rules (already implemented)

- Edit / Delete buttons only appear on the **most recent transaction** (index 0)
- Numeric inputs auto-select on focus to prevent leading zeros
- Theme toggle is in the Settings modal ⚙️ (NOT in header)
- Rocket FAB (🚀) is bottom-left; Plus FAB (+) is bottom-right
