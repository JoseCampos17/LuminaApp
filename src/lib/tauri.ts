import { invoke as tauriInvoke } from "@tauri-apps/api/core";

const isTauri = !!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__;

/**
 * A wrapper around Tauri's invoke that provides mocks when running in a regular browser.
 */
export async function invoke(command: string, args: any = {}): Promise<any> {
  if (!isTauri) {
    console.warn(`[Browser Mock] Calling command: ${command}`, args);

    // Simple mocks for browser development
    switch (command) {
      case "get_salary":
        const saved = localStorage.getItem("mock_salary");
        const savedCurr = localStorage.getItem("mock_salary_currency") || "USD";
        const amt = saved !== null ? Number(saved) : 1000; // default 1000 USD
        return { amount: amt, currency: savedCurr };
      case "update_salary":
        localStorage.setItem("mock_salary", args.amount.toString());
        localStorage.setItem("mock_salary_currency", args.currency || "USD");
        return null;
      case "get_transactions":
        return JSON.parse(localStorage.getItem("mock_transactions") || "[]");
      case "add_event":
        const txs = JSON.parse(localStorage.getItem("mock_transactions") || "[]");
        const txPayload = JSON.parse(args.event.payload);
        txs.push({
          id: args.event.event_id,
          ...txPayload
        });
        localStorage.setItem("mock_transactions", JSON.stringify(txs));
        return null;
      case "delete_transaction":
        console.log("[Mock] Deleting ID:", args.id);
        const allTxs = JSON.parse(localStorage.getItem("mock_transactions") || "[]");
        console.log("[Mock] Current count:", allTxs.length);
        const filteredTxs = allTxs.filter((t: any) => String(t.id) !== String(args.id));
        console.log("[Mock] Count after:", filteredTxs.length);
        localStorage.setItem("mock_transactions", JSON.stringify(filteredTxs));
        return null;
      case "update_transaction":
        const currentTxs = JSON.parse(localStorage.getItem("mock_transactions") || "[]");
        const entryIdx = currentTxs.findIndex((t: any) => t.id === args.id);
        if (entryIdx !== -1) {
          currentTxs[entryIdx] = { ...currentTxs[entryIdx], ...args };
          localStorage.setItem("mock_transactions", JSON.stringify(currentTxs));
        }
        return null;
      case "get_recurring_expenses":

        return JSON.parse(localStorage.getItem("mock_recurring") || "[]");
      case "add_recurring_expense":
        const recs = JSON.parse(localStorage.getItem("mock_recurring") || "[]");
        recs.push(args.expense);
        localStorage.setItem("mock_recurring", JSON.stringify(recs));
        return null;
      case "delete_recurring_expense":
        const filtered = JSON.parse(localStorage.getItem("mock_recurring") || "[]")
          .filter((e: any) => e.id !== args.id);
        localStorage.setItem("mock_recurring", JSON.stringify(filtered));
        return null;
      default:
        return null;
    }
  }

  return await tauriInvoke(command, args);
}
