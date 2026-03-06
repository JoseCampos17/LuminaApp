// ============================================================
// Spending Alerts — Pure logic for local push notifications
// No state, no side-effects other than invoking Tauri.
// ============================================================

import { invoke } from "$lib/tauri";
import type { Transaction, RecurringExpense } from "$lib/types";

export async function checkSpendingAlert(
  salaryUSD: number,
  recurringExpenses: RecurringExpense[],
  transactions: Transaction[],
  newTxAmount?: number
) {
  // Only relevant when salary is configured
  if (salaryUSD <= 0) return;

  const netIncome =
    salaryUSD -
    recurringExpenses.reduce((sum, e) => {
      return sum + (e.frequency === "weekly" ? e.amount * 2 : e.amount * 0.5);
    }, 0);

  if (netIncome <= 0) return;

  const now = new Date();
  const day = now.getDate();
  const isFirstQ = day <= 15;

  const periodTxs = transactions.filter((t) => {
    const d = new Date(t.date + "T00:00:00");
    if (
      d.getMonth() !== now.getMonth() ||
      d.getFullYear() !== now.getFullYear()
    )
      return false;
    return isFirstQ ? d.getDate() <= 15 : d.getDate() > 15;
  });

  const variableSpent = periodTxs
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const budgetLeft = Math.max(0, netIncome - variableSpent);
  const liquidityPct = Math.round((budgetLeft / netIncome) * 100);

  const entertainmentSpent = periodTxs
    .filter(
      (t) => t.amount < 0 && t.category?.toLowerCase() === "entretenimiento"
    )
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  try {
    // Alert 1: Single transaction > 20% of net income
    if (newTxAmount && Math.abs(newTxAmount) > netIncome * 0.2) {
      await invoke("send_notification", {
        title: "⚠️ Gasto alto detectado",
        body: `Acabas de gastar más del 20% de tu ingreso neto en una sola transacción. ¿Era necesario?`,
      });
    }

    // Alert 2: Liquidity drops below 20%
    if (liquidityPct < 20 && liquidityPct > 0) {
      await invoke("send_notification", {
        title: "🚨 Liquidez baja",
        body: `Solo te queda el ${liquidityPct}% de tu disponible quincenal. Considera pausar los gastos variables.`,
      });
    }

    // Alert 3: Entertainment > 15% of net income
    if (entertainmentSpent > netIncome * 0.15) {
      await invoke("send_notification", {
        title: "🎮 Muchos gastos de entretenimiento",
        body: `Llevas gastado ${Math.round((entertainmentSpent / netIncome) * 100)}% de tu quincena en entretenimiento.`,
      });
    }
  } catch (_) {
    // Notifications may not be available in web browser — silently ignore
  }
}
