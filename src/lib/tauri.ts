import { invoke as tauriInvoke } from "@tauri-apps/api/core";

const isTauri = !!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__;

/**
 * A wrapper around Tauri's invoke that provides mocks when running in a regular browser.
 */
export async function invoke(command: string, args: any = {}): Promise<any> {
  if (!isTauri) {
    // Simple mocks for browser development
    switch (command) {
      case "get_salary":
        const saved = localStorage.getItem("mock_salary");
        const savedCurr = localStorage.getItem("mock_salary_currency") || "USD";
        const amt = saved !== null ? Number(saved) : 0; // default 0
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
        const allTxs = JSON.parse(localStorage.getItem("mock_transactions") || "[]");
        const filteredTxs = allTxs.filter((t: any) => String(t.id) !== String(args.id));
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
      case "clear_all_data":
        localStorage.removeItem("mock_transactions");
        localStorage.removeItem("mock_recurring");
        localStorage.removeItem("mock_salary_history");
        localStorage.removeItem("mock_salary");
        localStorage.removeItem("mock_salary_currency");
        return null;

      case "get_salary_history":
        const hist = JSON.parse(localStorage.getItem("mock_salary_history") || "[]");
        const limit = args.limit || 10;
        const offset = args.offset || 0;
        return hist.slice(offset, offset + limit);

      case "delete_salary_record":
        const currentHist = JSON.parse(localStorage.getItem("mock_salary_history") || "[]");
        const updatedHist = currentHist.filter((r: any) => r.id !== args.id);
        localStorage.setItem("mock_salary_history", JSON.stringify(updatedHist));
        return null;

      case "get_notification_settings":
        const savedSettings = JSON.parse(localStorage.getItem("mock_notification_settings") || "null");
        if (savedSettings) return savedSettings;
        // Return defaults
        return [
          { key: "liquidity_warning", enabled: true },
          { key: "liquidity_critical", enabled: true },
          { key: "salary_day", enabled: true },
          { key: "recurring_due_soon", enabled: true },
          { key: "overspent", enabled: true },
        ];

      case "update_notification_setting": {
        const allSettings = JSON.parse(localStorage.getItem("mock_notification_settings") || JSON.stringify([
          { key: "liquidity_warning", enabled: true },
          { key: "liquidity_critical", enabled: true },
          { key: "salary_day", enabled: true },
          { key: "recurring_due_soon", enabled: true },
          { key: "overspent", enabled: true },
        ]));
        const idx = allSettings.findIndex((s: any) => s.key === args.key);
        if (idx !== -1) allSettings[idx].enabled = args.enabled;
        localStorage.setItem("mock_notification_settings", JSON.stringify(allSettings));
        return null;
      }

      case "send_notification":
        // No-op in browser — shows nothing, but doesn't throw either
        return null;

      default:
        return null;
    }
  }

  return await tauriInvoke(command, args);
}
