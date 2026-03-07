// ============================================================
// Finance Store — Global reactive state for Lumina
// Uses Svelte 5 runes ($state, $derived) as a module-level store
// ============================================================

import { invoke } from "$lib/tauri";
import { loadCurrencies, toUSD, formatAmount, fetchRates } from "$lib/currencies";
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

export function setLocalCurrency(code: string) {
  financeState.localCurrency = code;
  financeState.currency = code;
  localStorage.setItem("lumina_local_currency", code);
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
    return sum + (e.frequency === "weekly"
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

export async function clearAllData() {
  console.log("[financeStore] Clearing all data...");
  try {
    await invoke("clear_all_data");
    await loadData();
  } catch (e) {
    console.error("[financeStore] clearAllData error:", e);
  }
}
