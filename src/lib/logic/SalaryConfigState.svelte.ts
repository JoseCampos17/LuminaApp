import { invoke } from "$lib/tauri";
import { onMount } from "svelte";
import { toUSD, fromUSD, loadCurrencies } from "$lib/currencies";
import { financeState } from "$lib/stores/finance.svelte";
import type { CurrencyDef } from "$lib/currencies";

const LS_FREQ_KEY = "lumina_salary_frequency";

function loadFrequencyPref(): "quincena" | "mes" {
  try {
    const saved = localStorage.getItem(LS_FREQ_KEY);
    if (saved === "mes" || saved === "quincena") return saved;
  } catch (_) { }
  return "quincena";
}

function saveFrequencyPref(freq: "quincena" | "mes") {
  try {
    localStorage.setItem(LS_FREQ_KEY, freq);
  } catch (_) { }
}

export class SalaryConfigState {
  /**
   * Always stored as the bi-weekly (quincenal) equivalent in USD.
   * The database key is biweekly_salary for historical reasons.
   */
  salaryUSD = $state(0);

  /**
   * Stored in localStorage only — purely a UI preference for how the user
   * wants to enter/view the salary. Does NOT affect math in the database.
   */
  salaryFrequency = $state(loadFrequencyPref());
  isEditing = $state(false);
  editValue = $state(0);
  editFrequency = $state(loadFrequencyPref());

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

  /**
   * Display amount in the config card.
   * If frequency is "mes", show monthly equivalent (bi-weekly × 2).
   */
  get displayAmount() {
    const multiplier = this.salaryFrequency === "mes" ? 2 : 1;
    return fromUSD(this.salaryUSD * multiplier, this.props.currency, this.currencies);
  }

  startEdit = () => {
    const multiplier = this.salaryFrequency === "mes" ? 2 : 1;
    this.editValue = parseFloat(
      fromUSD(this.salaryUSD * multiplier, this.props.currency, this.currencies).toFixed(2),
    );
    this.editFrequency = this.salaryFrequency;
    this.isEditing = true;
  };

  loadSalary = async () => {
    try {
      const data = await invoke("get_salary", {
        month: financeState.selectedMonth,
        year: financeState.selectedYear
      }) as any;
      const rawAmount = data.amount;
      const rawCurrency = data.currency || "USD";

      // The database ALWAYS stores the bi-weekly equivalent.
      // Frequency is a frontend-only concept. No normalization needed.
      this.salaryUSD = toUSD(rawAmount, rawCurrency, this.currencies);
    } catch (e) {
      console.error("Error loading salary:", e);
    }
  };

  saveSalary = async () => {
    try {
      // Convert user input to the bi-weekly equivalent in local currency
      const biweeklyLocal = this.editFrequency === "mes"
        ? this.editValue / 2
        : this.editValue;

      // Save the bi-weekly amount directly to the database
      await invoke("update_salary", {
        amount: biweeklyLocal,
        currency: this.props.currency,
        frequency: "quincena", // always quincena since we normalize before saving
        month: financeState.selectedMonth,
        year: financeState.selectedYear
      });

      // Persist the frequency preference in localStorage
      saveFrequencyPref(this.editFrequency);
      this.salaryFrequency = this.editFrequency;

      this.isEditing = false;
      await this.loadSalary();
      this.props.onSalaryUpdated();
    } catch (e) {
      console.error("Error saving salary:", e);
    }
  };
}
