import type { Transaction } from "$lib/types";

/**
 * Generates a CSV string from the given transactions and triggers a download.
 * Works in browser (Vite dev) and in the Tauri WebView on all platforms.
 */
export function exportTransactionsCSV(
  transactions: Transaction[],
  currency: string,
  filename = "lumina_historial.csv",
): void {
  const header = ["Fecha", "Categoría", "Descripción", "Monto", "Moneda"];
  const rows = transactions.map((t) => [
    t.date,
    escapeCsv(t.category || "Sin categoría"),
    escapeCsv(t.description || ""),
    t.amount.toFixed(2),
    currency,
  ]);

  const content = [header, ...rows].map((row) => row.join(",")).join("\n");
  downloadText(filename, content, "text/csv;charset=utf-8;");
}

function escapeCsv(value: string): string {
  // Wrap in quotes if it contains comma, quote, or newline
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadText(filename: string, content: string, mimeType: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: mimeType }); // BOM for Excel UTF-8
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
