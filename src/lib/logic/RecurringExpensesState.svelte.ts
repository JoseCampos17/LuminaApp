import { invoke } from "$lib/tauri";
import { onMount } from "svelte";

export class RecurringExpensesState {
  recurringExpenses = $state<any[]>([]);
  showAdd = $state(false);
  showAll = $state(false);

  newDesc = $state("");
  newAmount = $state(0);
  newFrequency = $state("monthly");
  newDayOfMonth = $state(1);
  newDayOfWeek = $state(1);

  daysOfWeek = [
    { v: 1, l: "Lunes" },
    { v: 2, l: "Martes" },
    { v: 3, l: "Miércoles" },
    { v: 4, l: "Jueves" },
    { v: 5, l: "Viernes" },
    { v: 6, l: "Sábado" },
    { v: 0, l: "Domingo" },
  ];

  editingId: string | null = null;
  props: { onUpdated: () => void; initialExpense?: any };

  constructor(props: { onUpdated: () => void; initialExpense?: any }) {
    this.props = props;
    if (this.props.initialExpense) {
      this.editingId = this.props.initialExpense.id;
      this.newDesc = this.props.initialExpense.description;
      this.newAmount = this.props.initialExpense.amount;
      this.newFrequency = this.props.initialExpense.frequency;
      this.newDayOfMonth = this.props.initialExpense.day_of_month || 1;
      this.newDayOfWeek = this.props.initialExpense.day_of_week ?? 1;
      this.showAdd = true;
    }

    onMount(() => {
      this.load();
    });
  }

  load = async () => {
    try {
      let expenses: any[] = await invoke("get_recurring_expenses");

      // Auto-Migration logic was removed here (mocks insertion)


      expenses.sort((a: any, b: any) => {
        const idA = parseInt(a.id, 10);
        const idB = parseInt(b.id, 10);
        return isNaN(idA) || isNaN(idB) ? b.id.localeCompare(a.id) : idB - idA;
      });

      this.recurringExpenses = expenses;
    } catch (e) {
      console.error(e);
    }
  };

  save = async (selectedCategory: string = "Otros") => {
    if (!this.newDesc || this.newAmount <= 0) return;

    try {
      if (this.editingId) {
        await invoke("delete_recurring_expense", { id: this.editingId });
      }

      let newIdStr = "1";
      if (!this.editingId && this.recurringExpenses.length > 0) {
        const numericIds = this.recurringExpenses
          .map(e => parseInt(e.id, 10))
          .filter(n => !isNaN(n));
        const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
        newIdStr = (maxId + 1).toString();
      }

      await invoke("add_recurring_expense", {
        expense: {
          id: this.editingId || newIdStr,
          description: this.newDesc,
          amount: this.newAmount,
          frequency: this.newFrequency,
          day_of_month:
            this.newFrequency === "monthly" ? this.newDayOfMonth : null,
          day_of_week:
            this.newFrequency === "weekly" ? this.newDayOfWeek : null,
          category: selectedCategory,
        },
      });

      this.newDesc = "";
      this.newAmount = 0;
      this.showAdd = false;
      this.editingId = null;
      await this.load();
      this.props.onUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  remove = async (id: string) => {
    try {
      await invoke("delete_recurring_expense", { id });
      await this.load();
      this.props.onUpdated();
    } catch (e) {
      console.error(e);
    }
  };
}
