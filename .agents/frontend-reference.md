# Frontend Reference – Components & State

## Main Page: `src/routes/+page.svelte`

The **single page** of the app. All state lives here and is passed down to components as props.

### Key State Variables

```ts
salaryUSD: number        // biweekly salary in USD (internal base)
transactions: Transaction[]  // from SQLite via get_transactions
recurringExpenses: any[]     // from SQLite via get_recurring_expenses
localCurrency: string    // user's chosen local currency ("COP" | "CLP"), from localStorage
currency: string         // active display currency (localCurrency or "USD")
currencies: CurrencyDef[] // loaded from currencies.ts (includes user-customized rates)
viewMode: "quincena"|"mes"  // period selector
```

### Derived Financial Values (all in USD)

```ts
isMonthly        = viewMode === "mes"
multiplier       = isMonthly ? 2 : 1
salaryValue      = salaryUSD * multiplier

currentPeriodTransactions   // filtered to current quincena or month
displayVariableExpenses // sum of negative txs → toUSD(amount, localCurrency)
displayExtraIncome      // sum of positive txs → toUSD(amount, localCurrency)
displayRecurring        // sum of recurring → toUSD(amount, localCurrency)
displayNetIncome        // salaryValue - displayRecurring
displayBudgetRemaining  // displayNetIncome - displayVariableExpenses
displayRadarValue       // (displayBudgetRemaining / displayNetIncome) * 100 → clamped %

formatCurrency(usdAmount) → calls formatAmount(usd, currency, currencies)
```

### Modal Flags

```ts
(showTransactionModal,
  showSettingsModal,
  showSavingsModal,
  showHistoryModal,
  showEditModal,
  showTutorial);
```

## Component Props Summary

| Component           | Key Props                                                        |
| ------------------- | ---------------------------------------------------------------- |
| `CurrencyToggle`    | `currency`, `currencies` (inline-built 2-item list), `onToggle`  |
| `SalaryConfig`      | `currency={localCurrency}`, `currencies?`, `onSalaryUpdated`     |
| `CurrencyRates`     | `currencies?`, `onRatesUpdated`                                  |
| `RecurringExpenses` | `onUpdated`                                                      |
| `TransactionForm`   | `onTransactionAdded(amount?)`                                    |
| `SavingsSimulator`  | `availableBalance={displayBudgetRemaining}`                      |
| `FinancialInsights` | `netIncome`, `variableExpenses`, `recurringExpenses`, `viewMode` |

## CSS Architecture (`app.css` + scoped `<style>` in each component)

CSS custom properties (variables) are defined on `:root` in `app.css`:

- `--bg-color`, `--card-bg`, `--text-color`, `--text-dim`
- `--glass-border`, `--dark-bg`, `--input-bg`
- `--neon-blue`, `--neon-purple`, `--neon-green`

Light mode is activated by adding class `light-theme` to `<html>` (via `ThemeToggle.svelte`). All components must use these variables — **never hardcode colors**.

## Layout

- **Header** (`.top-nav`): `Lumina` brand + `CurrencyToggle` + ⚙️ button
- **Radar** (`.main-radar`): SVG circle showing liquidity % + period selector
- **Summary cards** (`.summary-cards`): Ingreso Neto + Gastos Variables
- **Insights** (`.insights-section`): `FinancialInsights` component
- **Timeline** (`.timeline`): last 5 transactions in current period
- **FAB Container**: 🚀 fixed bottom-left, + fixed bottom-right

## Settings Modal Order

1. Apariencia visual (ThemeToggle)
2. Divisa Local (COP / CLP selector)
3. Configuración quincenal (SalaryConfig)
4. Tasas de Cambio (CurrencyRates)
5. Gastos Fijos (RecurringExpenses)
