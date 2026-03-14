import type { Transaction } from "$lib/types";

export interface CategorySlice {
  category: string;
  total: number;
  percent: number;
  color: string;
}

const PALETTE = [
  "#00d4ff", // neon-blue
  "#a855f7", // neon-purple
  "#22c55e", // neon-green
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
];

export class CategoryChartState {
  constructor(
    private props: {
      get transactions(): Transaction[];
    },
  ) {}

  get expenseTransactions(): Transaction[] {
    return this.props.transactions.filter((t) => t.amount < 0);
  }

  get totalExpenses(): number {
    return this.expenseTransactions.reduce((s, t) => s + Math.abs(t.amount), 0);
  }

  get slices(): CategorySlice[] {
    if (this.totalExpenses === 0) return [];

    const grouped = new Map<string, number>();
    for (const tx of this.expenseTransactions) {
      const cat = tx.category || "Sin categoría";
      grouped.set(cat, (grouped.get(cat) ?? 0) + Math.abs(tx.amount));
    }

    return Array.from(grouped.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, total], i) => ({
        category,
        total,
        percent: (total / this.totalExpenses) * 100,
        color: PALETTE[i % PALETTE.length],
      }));
  }

  get categories(): string[] {
    const cats = new Set(
      this.props.transactions.map((t) => t.category || "Sin categoría"),
    );
    return Array.from(cats).sort();
  }
}
