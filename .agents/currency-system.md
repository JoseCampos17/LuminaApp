# Multi-Currency System

## Core Principle: USD Internal Base

**All financial values are stored and calculated in USD internally.**  
Display conversion happens at the last moment using `formatAmount()`.

## File: `src/lib/currencies.ts`

```ts
interface CurrencyDef {
  code: string; // "USD" | "COP" | "CLP"
  locale: string; // BCP-47 for Intl.NumberFormat
  decimals: number; // max fraction digits
  rateToUsd: number; // local units per 1 USD (USD = 1)
}

DEFAULT_CURRENCIES = [
  { code: "USD", locale: "en-US", decimals: 2, rateToUsd: 1 },
  { code: "COP", locale: "es-CO", decimals: 0, rateToUsd: 4000 },
  { code: "CLP", locale: "es-CL", decimals: 0, rateToUsd: 940 },
];
```

### Key Functions

| Function                                      | Signature         | Usage                                                                            |
| --------------------------------------------- | ----------------- | -------------------------------------------------------------------------------- |
| `loadCurrencies()`                            | `→ CurrencyDef[]` | Loads defaults, overlays user rates from `localStorage["lumina_currency_rates"]` |
| `saveCurrencies(currencies)`                  | `→ void`          | Persists `{code: rateToUsd}` map to `localStorage`                               |
| `toUSD(amount, fromCode, currencies?)`        | `→ number`        | Convert local → USD: `amount / rateToUsd`                                        |
| `fromUSD(usd, toCode, currencies?)`           | `→ number`        | Convert USD → local: `usd * rateToUsd`                                           |
| `formatAmount(usd, displayCode, currencies?)` | `→ string`        | Full formatted string (e.g. `"$4.000.000"`)                                      |
| `getCurrency(code, currencies?)`              | `→ CurrencyDef`   | Lookup with USD fallback                                                         |

> **All functions are defensive:** if `currencies` is `undefined` or empty they fall back to `DEFAULT_CURRENCIES`. Safe to call at any time.

## State in `+page.svelte`

```svelte
let localCurrency = $state(localStorage.getItem("lumina_local_currency") || "COP")
let currency      = $state(localCurrency)  // active display currency
let currencies    = $state(loadCurrencies())

const toggleOptions = $derived([localCurrency, "USD"].filter(unique))

function setLocalCurrency(code) {
  localCurrency = code
  currency = code
  localStorage.setItem("lumina_local_currency", code)
}
```

## Data Flow

1. **Salary**: user enters in `localCurrency` → `SalaryConfig` converts to USD via `toUSD()` → saved as USD → displayed via `fromUSD()`.
2. **Transactions**: entered in `localCurrency` by the user → stored as-is in SQLite → when calculating totals, `+page.svelte` converts with `toUSD(amount, localCurrency)`.
3. **Display**: all computed USD values are passed through `formatCurrency(usdAmount)` → internally calls `formatAmount(usdAmount, currency, currencies)`.
4. **Recurring expenses**: stored in `localCurrency` → converted with `toUSD(e.amount, localCurrency)` when summed.

## Components

| Component        | Role                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `CurrencyToggle` | Header toggle between `[localCurrency, "USD"]`. Receives a minimal currencies prop built inline in +page.svelte.              |
| `CurrencyRates`  | Settings panel to edit `rateToUsd` for non-USD currencies. Saves via `saveCurrencies()`.                                      |
| `SalaryConfig`   | Settings panel. Calls `getCurrencies()` locally (safe fallback). Displays salary in `localCurrency`, saves to backend in USD. |

## Adding a New Currency

1. Add entry to `DEFAULT_CURRENCIES` in `currencies.ts`
2. If it should be selectable as "local currency", add its code to the `['COP', 'CLP']` array in the Settings modal inside `+page.svelte`.
