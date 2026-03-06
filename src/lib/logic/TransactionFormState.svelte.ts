import { invoke } from "$lib/tauri";
import { ulid } from "ulid";

export class TransactionFormState {
  description = $state("");
  amount = $state(0);
  category = $state("Comida");
  type = $state("gasto");
  date = $state(new Date().toISOString().split("T")[0]);

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
        const aggregateId = ulid();
        const eventId = ulid();

        const payload = JSON.stringify({
          amount: finalAmount,
          category: this.category,
          description: this.description,
          date: this.date,
        });
        const event = {
          event_id: eventId,
          aggregate_id: aggregateId,
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
