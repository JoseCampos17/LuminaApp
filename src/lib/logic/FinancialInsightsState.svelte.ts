import type { RecurringExpense } from "$lib/types";

export class FinancialInsightsState {
  constructor(
    private props: {
      get netIncome(): number;
      get variableExpenses(): number;
      get recurringExpenses(): RecurringExpense[];
      get viewMode(): string;
    },
  ) {}

  get isMonthly() {
    return this.props.viewMode === "mes";
  }

  get quincena1Fijos() {
    return this.props.recurringExpenses.reduce(
      (sum: number, e: RecurringExpense) => {
        if (e.frequency === "weekly") return sum + e.amount * 2;
        if (e.frequency === "monthly" && (e.day_of_month ?? 0) <= 15)
          return sum + e.amount;
        return sum;
      },
      0,
    );
  }

  get quincena2Fijos() {
    return this.props.recurringExpenses.reduce(
      (sum: number, e: RecurringExpense) => {
        if (e.frequency === "weekly") return sum + e.amount * 2;
        if (e.frequency === "monthly" && (e.day_of_month ?? 0) > 15)
          return sum + e.amount;
        return sum;
      },
      0,
    );
  }

  get isNextHeavy() {
    const today = new Date().getDate();
    if (today <= 15) return this.quincena2Fijos > this.quincena1Fijos;
    return this.quincena1Fijos > this.quincena2Fijos;
  }

  get totalSalary() {
    return (
      this.props.netIncome +
      (this.quincena1Fijos + this.quincena2Fijos) / (this.isMonthly ? 1 : 2)
    );
  }

  get totalFijos() {
    return (
      (this.quincena1Fijos + this.quincena2Fijos) / (this.isMonthly ? 1 : 2)
    );
  }

  get totalSpent() {
    return this.totalFijos + this.props.variableExpenses;
  }

  get needsPercent() {
    return (this.totalFijos / this.totalSalary) * 100;
  }

  get spentPercent() {
    return (this.totalSpent / this.totalSalary) * 100;
  }

  get isOverspent() {
    return this.props.variableExpenses > this.props.netIncome;
  }
}
