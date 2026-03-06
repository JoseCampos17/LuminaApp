import { invoke } from "$lib/tauri";
import { onMount } from "svelte";
import { toUSD, fromUSD, loadCurrencies } from "$lib/currencies";
import type { CurrencyDef } from "$lib/currencies";

export class SalaryConfigState {
  salaryUSD = $state(0);
  isEditing = $state(false);
  editValue = $state(0);

  constructor(
    private props: {
      onSalaryUpdated: () => void;
      currency: string;
      currencies?: CurrencyDef[];
    },
  ) {
    onMount(() => {
      this.loadSalary();
    });
  }

  get currencies() {
    return this.props.currencies && this.props.currencies.length > 0
      ? this.props.currencies
      : loadCurrencies();
  }

  get displayAmount() {
    return fromUSD(this.salaryUSD, this.props.currency, this.currencies);
  }

  startEdit = () => {
    this.editValue = parseFloat(
      fromUSD(this.salaryUSD, this.props.currency, this.currencies).toFixed(2),
    );
    this.isEditing = true;
  };

  loadSalary = async () => {
    try {
      const data = await invoke("get_salary");
      const rawAmount = typeof data === "number" ? data : data.amount;
      const rawCurrency =
        typeof data === "number" ? "USD" : data.currency || "USD";
      this.salaryUSD = toUSD(rawAmount, rawCurrency, this.currencies);
    } catch (e) {
      console.error("Error loading salary:", e);
    }
  };

  saveSalary = async () => {
    try {
      this.salaryUSD = toUSD(
        this.editValue,
        this.props.currency,
        this.currencies,
      );
      await invoke("update_salary", { amount: this.salaryUSD, currency: "USD" });
      this.isEditing = false;
      this.props.onSalaryUpdated();
    } catch (e) {
      console.error("Error saving salary:", e);
    }
  };
}
