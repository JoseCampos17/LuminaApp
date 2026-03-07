// ============================================================
// Finance Store — Global reactive state for Lumina
// Uses Svelte 5 runes ($state, $derived) as a module-level store
// ============================================================

import { invoke } from "$lib/tauri";
import { loadCurrencies, toUSD, fromUSD, formatAmount, fetchRates } from "$lib/currencies";
import type { CurrencyDef } from "$lib/currencies";
import type { Transaction, RecurringExpense } from "$lib/types";

// ─── Mutable State Object (module-level Svelte 5 store pattern) ───────────────

export const financeState = $state({
  transactions: [] as Transaction[],
  recurringExpenses: [] as RecurringExpense[],

  /** Salary stored internally in USD (normalized to the saved frequency). */
  salaryUSD: 0,
  salaryFrequency: "quincena" as "quincena" | "mes",

  /** User's chosen local currency (COP | CLP). */
  localCurrency:
    typeof localStorage !== "undefined"
      ? localStorage.getItem("lumina_local_currency") || "COP"
      : "COP",

  /** Active display currency. Starts equal to localCurrency. */
  currency: typeof localStorage !== "undefined"
    ? localStorage.getItem("lumina_local_currency") || "COP"
    : "COP",

  /** View mode: biweekly (quincena) or monthly (mes). */
  viewMode: "quincena" as "quincena" | "mes",

  /** Available currencies with user-saved rates. */
  currencies: loadCurrencies() as CurrencyDef[],

  /** Category filters for recurring expenses (empty means "Todos") */
  filterCategories: [] as string[],
});

export function getFilteredRecurring() {
  if (financeState.filterCategories.length === 0) return financeState.recurringExpenses;
  return financeState.recurringExpenses.filter(e => financeState.filterCategories.includes((e as any).category || "Otros"));
}

// ─── Setters ─────────────────────────────────────────────────────────────────

export function setLocalCurrency(code: string, skipPersistence: boolean = false) {
  financeState.localCurrency = code;
  financeState.currency = code;
  if (!skipPersistence) {
    localStorage.setItem("lumina_local_currency", code);
  }
}

export function handleRatesUpdated(updated: CurrencyDef[]) {
  financeState.currencies = updated;
}

// ─── Derived Getters (as functions for reactivity in .svelte files) ───────────

export function isMonthly() {
  return financeState.viewMode === "mes";
}

export function salaryValue() {
  // salaryUSD is always stored as the bi-weekly (quincenal) equivalent.
  return financeState.salaryUSD * (isMonthly() ? 2 : 1);
}

export function toggleOptions() {
  const { localCurrency } = financeState;
  return [localCurrency, "USD"].filter((v, i, a) => a.indexOf(v) === i);
}

export function currentPeriodTransactions() {
  const now = new Date();
  const monthly = isMonthly();
  return financeState.transactions
    .filter((t) => {
      const txDate = new Date(t.date + "T00:00:00");
      if (
        txDate.getMonth() !== now.getMonth() ||
        txDate.getFullYear() !== now.getFullYear()
      ) return false;
      if (monthly) return true;
      const day = now.getDate();
      const isFirstQ = day <= 15;
      return isFirstQ ? txDate.getDate() <= 15 : txDate.getDate() > 15;
    })
    .sort((a, b) => b.id.localeCompare(a.id));
}

export function displayVariableExpenses() {
  return currentPeriodTransactions()
    .filter((t) => t.amount < 0)
    .reduce(
      (sum, t) => sum + toUSD(Math.abs(t.amount), financeState.localCurrency, financeState.currencies),
      0
    );
}

export function displayExtraIncome() {
  return currentPeriodTransactions()
    .filter((t) => t.amount > 0)
    .reduce(
      (sum, t) => sum + toUSD(t.amount, financeState.localCurrency, financeState.currencies),
      0
    );
}

export function displayRecurring() {
  const monthly = isMonthly();
  return financeState.recurringExpenses.reduce((sum, e) => {
    const amtUSD = toUSD(e.amount, financeState.localCurrency, financeState.currencies);
    return sum + (e.frequency === "daily"
      ? amtUSD * (monthly ? 30 : 15)
      : e.frequency === "weekly"
        ? amtUSD * (monthly ? 4 : 2)
        : amtUSD * (monthly ? 1 : 0.5));
  }, 0);
}

export function displayNetIncome() {
  return salaryValue() + displayExtraIncome() - displayRecurring();
}

export function displayBudgetRemaining() {
  return displayNetIncome() - displayVariableExpenses();
}

export function displayRadarValue() {
  const net = displayNetIncome();
  return net > 0 ? Math.max(0, Math.round((displayBudgetRemaining() / net) * 100)) : 0;
}

export function formatCurrency(usdAmount: number): string {
  return formatAmount(usdAmount, financeState.currency, financeState.currencies);
}

/**
 * Formats an amount that is already stored in localCurrency (e.g. transactions, recurring).
 * Converts local → USD → display currency.
 */
export function formatLocalAmount(localAmount: number): string {
  const usd = toUSD(Math.abs(localAmount), financeState.localCurrency, financeState.currencies);
  return formatAmount(usd, financeState.currency, financeState.currencies);
}

/** Returns the active display currency code (e.g. "COP", "CLP", "USD"). */
export function currencyLabel(): string {
  return financeState.currency;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function loadData() {
  try {
    // 1. Fetch latest rates automatically
    financeState.currencies = await fetchRates();

    // 2. Load other data
    financeState.transactions = await invoke("get_transactions");

    const salaryData = await invoke("get_salary") as any;
    const rawAmount = typeof salaryData === "number" ? salaryData : salaryData.amount;
    const rawCurrency = typeof salaryData === "number" ? "USD" : (salaryData.currency || "USD");

    // DB always stores the bi-weekly (quincenal) equivalent — no normalization needed.
    financeState.salaryUSD = toUSD(rawAmount, rawCurrency, financeState.currencies);

    const exps: any[] = await invoke("get_recurring_expenses");
    exps.sort((a, b) => {
      const idA = parseInt(a.id, 10);
      const idB = parseInt(b.id, 10);
      return isNaN(idA) || isNaN(idB) ? b.id.localeCompare(a.id) : idB - idA;
    });
    financeState.recurringExpenses = exps;
  } catch (e) {
    console.error("[financeStore] loadData error:", e);
  }
}

export async function deleteTransaction(id: string) {
  console.log("[financeStore] Deleting transaction:", id);
  try {
    await invoke("delete_transaction", { id });
    await loadData();
  } catch (e) {
    console.error(e);
  }
}

export async function migrateCurrency(oldCode: string, newCode: string) {
  console.log(`[financeStore] Migrating from ${oldCode} to ${newCode}...`);
  try {
    // 1. Convert Salary
    const salaryData = await invoke("get_salary") as any;
    const oldSalaryAmt = typeof salaryData === "number" ? salaryData : salaryData.amount;
    const salaryCurr = typeof salaryData === "number" ? "USD" : (salaryData.currency || "USD");

    // If salary is in the old local currency, convert it
    if (salaryCurr === oldCode) {
      const usdAmt = toUSD(oldSalaryAmt, oldCode, financeState.currencies);
      const newLocalAmt = fromUSD(usdAmt, newCode, financeState.currencies);
      await invoke("update_salary", { amount: newLocalAmt, currency: newCode });
    }

    // 2. Convert Transactions
    const txs = await invoke("get_transactions") as Transaction[];
    for (const tx of txs) {
      // Logic: we assume transactions were in the old localCurrency
      const usd = toUSD(tx.amount, oldCode, financeState.currencies);
      const newAmt = fromUSD(usd, newCode, financeState.currencies);
      await invoke("update_transaction", {
        id: tx.id,
        amount: Math.round(newAmt),
        category: tx.category,
        description: tx.description,
        date: tx.date
      });
    }

    // 3. Convert Recurring Expenses
    const recurrings = await invoke("get_recurring_expenses") as RecurringExpense[];
    for (const re of recurrings) {
      const usd = toUSD(re.amount, oldCode, financeState.currencies);
      const newAmt = fromUSD(usd, newCode, financeState.currencies);

      // Since we don't have a direct "update_recurring_expense", we delete and re-add 
      // OR we just use add_recurring_expense which might overwrite if ID matches?
      // Looking at RecurringExpensesState.svelte.ts, it deletes then adds.
      await invoke("delete_recurring_expense", { id: re.id });
      await invoke("add_recurring_expense", {
        expense: {
          ...re,
          amount: Math.round(newAmt)
        }
      });
    }

    // 4. Update the local currency state and persistence
    setLocalCurrency(newCode);

    // 5. Reload exactly what we need
    await loadData();
    console.log("[financeStore] Migration complete.");
  } catch (e) {
    console.error("[financeStore] migrateCurrency error:", e);
  }
}

export async function clearAllData() {
  console.log("[financeStore] Clearing all data...");
  try {
    await invoke("clear_all_data");
    await loadData();
  } catch (e) {
    console.error("[financeStore] clearAllData error:", e);
  }
}
