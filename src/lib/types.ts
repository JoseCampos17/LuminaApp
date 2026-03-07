// ============================================================
// Shared domain types for Lumina finapp
// ============================================================

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface RecurringExpense {
  id: string;
  amount: number;
  description: string;
  frequency: "monthly" | "weekly" | "daily";
  day_of_month?: number | null;
  day_of_week?: number | null;
  category?: string;
}
