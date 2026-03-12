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

  /** Selection for history navigation */
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),

  /** Toggle for Time=Money "Time-Life Mode" */
  isTimeMode: false,
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

export function isCurrentPeriod() {
  const now = new Date();
  return (
    financeState.selectedMonth === now.getMonth() &&
    financeState.selectedYear === now.getFullYear()
  );
}

export function currentPeriodLabel() {
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return `${monthNames[financeState.selectedMonth]} ${financeState.selectedYear}`;
}

export function currentPeriodTransactions() {
  const selectedMonth = financeState.selectedMonth;
  const selectedYear = financeState.selectedYear;
  const now = new Date();

  // 1. Get Physical Transactions
  let baseTxs = [...financeState.transactions].filter((t) => {
    const txDate = new Date(t.date + "T00:00:00");
    if (txDate.getMonth() !== selectedMonth || txDate.getFullYear() !== selectedYear) return false;

    // Quincena filtering
    if (isMonthly()) return true;
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    if (isCurrentMonth) {
      const isFirstHalf = now.getDate() <= 15;
      return isFirstHalf ? txDate.getDate() <= 15 : txDate.getDate() > 15;
    }
    return true; // Show all for past/future months if in quincena mode? 
    // (Actually we should probably have a quincena toggle, but for now show all)
  });

  // 2. Inject Projections for Missing Records
  const isPastMonth = selectedYear < now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth < now.getMonth());

  if (!isPastMonth && financeState.salaryUSD > 0) {
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const frequency = financeState.salaryFrequency;

    const hasPhysical = (desc: string) => baseTxs.some(t => t.category === "Salario Base" && t.description.includes(desc));

    if (frequency === "quincena") {
      // Q1 Projection (Day 15)
      if (!hasPhysical("Quincena 1")) {
        // En modo quincena, solo mostramos la mitad (el valor configurado es el de la quincena)
        const isQ1Visible = isMonthly() || (now.getDate() <= 15);
        if (isQ1Visible) {
          baseTxs.push({
            id: `proj-q1-${selectedYear}-${selectedMonth}`,
            amount: fromUSD(financeState.salaryUSD, financeState.localCurrency, financeState.currencies),
            description: "Salario (Quincena 1)",
            date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-15`,
            category: "Salario Base"
          });
        }
      }
      // Q2 Projection (Last Day)
      if (!hasPhysical("Quincena 2")) {
        const isQ2Visible = isMonthly() || (now.getDate() > 15);
        if (isQ2Visible) {
          baseTxs.push({
            id: `proj-q2-${selectedYear}-${selectedMonth}`,
            amount: fromUSD(financeState.salaryUSD, financeState.localCurrency, financeState.currencies),
            description: "Salario (Quincena 2)",
            date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${lastDay}`,
            category: "Salario Base"
          });
        }
      }
    } else {
      // Monthly Projection
      if (!hasPhysical("Mensual")) {
        baseTxs.push({
          id: `proj-m-${selectedYear}-${selectedMonth}`,
          amount: fromUSD(financeState.salaryUSD, financeState.localCurrency, financeState.currencies),
          description: "Salario (Mensual)",
          date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${lastDay}`,
          category: "Salario Base"
        });
      }
    }
  }

  // Final Sort
  return baseTxs.sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeA === timeB) return b.id.localeCompare(a.id);
    return timeB - timeA;
  });
}

export function displayVariableExpenses() {
  return currentPeriodTransactions()
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function displayExtraIncome() {
  return currentPeriodTransactions()
    .filter((t) => t.amount > 0 && t.category !== "Salario Base")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function displayRecurring() {
  const monthly = isMonthly();
  return financeState.recurringExpenses.reduce((sum, e) => {
    const amt = e.amount;
    return sum + (e.frequency === "daily"
      ? amt * (monthly ? 30 : 15)
      : e.frequency === "weekly"
        ? amt * (monthly ? 4 : 2)
        : amt * (monthly ? 1 : 0.5));
  }, 0);
}

export function displayNetIncome() {
  const baseSalarySum = currentPeriodTransactions()
    .filter(t => t.category === "Salario Base" && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  return baseSalarySum + displayExtraIncome() - displayRecurring();
}

export function displayBudgetRemaining() {
  return displayNetIncome() - displayVariableExpenses();
}

export function displayRadarValue() {
  const net = displayNetIncome();
  return net > 0 ? Math.max(0, Math.round((displayBudgetRemaining() / net) * 100)) : 0;
}

  /** Converts a USD amount to "Xh Ym Zs" based on salary, or falls back to money if salary is 0. */
  function usdToTime(usdAmount: number): string {
    // calculate monthly equivalent in USD based on actual frequency
    const monthlySalaryUSD = financeState.salaryFrequency === "mes"
      ? financeState.salaryUSD
      : financeState.salaryUSD * 2;

    // Assuming an average of 160 working hours per month (40h/week * 4)
    const workingHoursPerMonth = 160;

    if (monthlySalaryUSD <= 0) return formatAmount(usdAmount, financeState.currency, financeState.currencies);

    const hourlyRateUSD = monthlySalaryUSD / workingHoursPerMonth;
    const totalHours = Math.abs(usdAmount) / hourlyRateUSD;

    if (totalHours === 0) return "0s";

    const totalMinutes = totalHours * 60;
    const totalSeconds = totalMinutes * 60;

    const h = Math.floor(totalHours);
    const m = Math.floor(totalMinutes % 60);
    const s = Math.round(totalSeconds % 60);

    const sign = usdAmount < 0 ? "-" : "";

    // Formatting Logic based on scale
    if (h > 0) {
      if (m === 0) return `${sign}${h}h`;
      return `${sign}${h}h ${m}m`;
    }

    if (m > 0) {
      if (s === 0) return `${sign}${m}m`;
      return `${sign}${m}m ${s}s`;
    }

  // Very small amounts just take seconds
  return `${sign}${s}s`;
}

export function formatCurrency(amount: number): string {
  if (financeState.isTimeMode) {
    const usd = toUSD(amount, financeState.localCurrency, financeState.currencies);
    return usdToTime(usd);
  }
  // Use formatAmount but from local base
  const usd = toUSD(amount, financeState.localCurrency, financeState.currencies);
  return formatAmount(usd, financeState.currency, financeState.currencies);
}

  /**
   * Formats an amount that is already stored in localCurrency (e.g. transactions, recurring).
   * Converts local → USD → display currency.
   */
export function formatLocalAmount(localAmount: number): string {
  const usd = toUSD(Math.abs(localAmount), financeState.localCurrency, financeState.currencies);
  if (financeState.isTimeMode) {
    const sign = localAmount < 0 ? -1 : 1;
    return usdToTime(usd * sign);
  }
  return formatAmount(usd, financeState.currency, financeState.currencies);
}

  /** Returns the active display currency code (e.g. "COP", "CLP", "USD"). */
export function currencyLabel(): string {
  return financeState.isTimeMode ? "⏳ TIEMPO" : financeState.currency;
}

  // ─── Actions ─────────────────────────────────────────────────────────────────

export async function loadData() {
  try {
    // 1. Fetch latest rates automatically
    financeState.currencies = await fetchRates();

    // 2. Load other data
    financeState.salaryUSD = 0; // Reset to avoid state leak from other months
    financeState.transactions = await invoke("get_transactions");

    try {
      console.log(`[Finance] Fetching salary for ${financeState.selectedMonth}/${financeState.selectedYear}`);
      const salaryData = await invoke("get_salary", {
        month: financeState.selectedMonth,
        year: financeState.selectedYear
      }) as any;
      console.log(`[Finance] Received salaryData:`, salaryData);

      const rawAmount = typeof salaryData === "number" ? salaryData : salaryData.amount;
      const rawCurrency = typeof salaryData === "number" ? "USD" : (salaryData.currency || "USD");
      const rawFrequency = typeof salaryData === "number" ? "quincena" : (salaryData.frequency || "quincena");

      financeState.salaryUSD = toUSD(rawAmount, rawCurrency, financeState.currencies);
      financeState.salaryFrequency = rawFrequency;
    } catch (err) {
      console.error("[Finance] Failed to load salary:", err);
      financeState.salaryUSD = 0;
    }

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
      // Migrate latest salary (agnostic of month for this global setting)
      await invoke("update_salary", {
        amount: newLocalAmt,
        currency: newCode,
        frequency: "quincena",
        month: null, // Global update
        year: null
      });
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
