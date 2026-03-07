import { invoke } from "$lib/tauri";
import { financeState } from "$lib/stores/finance.svelte";

export class TransactionFormState {
  description = $state("");
  amount = $state(0);
  category = $state("Comida");
  type = $state("gasto");
  date = $state("");

  constructor(
    private props: {
      onTransactionAdded: (amount: number) => void;
      editData?: any;
    },
  ) {
    if (props.editData) {
      this.description = props.editData.description || "";
      this.amount = Math.abs(props.editData.amount) || 0;
      this.category = props.editData.category || "Comida";
      this.type = props.editData.amount > 0 ? "ingreso" : "gasto";
      this.date = props.editData.date || new Date().toISOString().split("T")[0];
    } else {
      this.date = this.getDefaultDate();
    }
  }

  private getDefaultDate() {
    const now = new Date();
    const isCurrentMonth =
      financeState.selectedMonth === now.getMonth() &&
      financeState.selectedYear === now.getFullYear();

    if (isCurrentMonth) {
      return now.toISOString().split("T")[0];
    } else {
      // First day of selected period
      const d = new Date(financeState.selectedYear, financeState.selectedMonth, 1);
      // Ensure local time split
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  handleSubmit = async () => {
    if (this.amount <= 0 || this.description === "") return;

    const finalAmount =
      this.type === "gasto" ? -Math.abs(this.amount) : Math.abs(this.amount);

    try {
      if (this.props.editData) {
        await invoke("update_transaction", {
          id: this.props.editData.id,
          amount: finalAmount,
          category: this.category,
          description: this.description,
          date: this.date,
        });
      } else {
        const txs = await invoke("get_transactions");
        const numericIds = txs
          .map((t: any) => parseInt(t.id, 10))
          .filter((n: any) => !isNaN(n));
        const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
        const newId = (maxId + 1).toString();

        const payload = JSON.stringify({
          amount: finalAmount,
          category: this.category,
          description: this.description,
          date: this.date,
        });
        const event = {
          event_id: newId,
          aggregate_id: newId,
          aggregate_type: "TRANSACTION",
          event_type: "TRANSACTION_CREATED",
          payload,
          hlc: new Date().toISOString() + "-0001-LOCAL",
          origin_node_id: "LOCAL_NODE",
        };
        await invoke("add_event", { event });
      }

      const sentAmount = finalAmount;
      if (!this.props.editData) {
        this.description = "";
        this.amount = 0;
      }
      this.props.onTransactionAdded(sentAmount);
    } catch (e) {
      console.error("Error processing transaction:", e);
    }
  };
}
