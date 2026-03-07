import { formatCurrency } from "$lib/stores/finance.svelte";

export class SavingsSimulatorState {
  savingsPercent = $state(20);
  months = 3;
  biWeeks = 6;

  constructor(private props: { get availableBalance(): number }) {
    this.biWeeks = this.months * 2;
  }

  get isNegative() {
    return this.props.availableBalance < 0;
  }

  get amountToSavePerBiWeek() {
    if (this.isNegative) {
      // If negative, we project the full deficit per period
      return this.props.availableBalance;
    }
    return this.props.availableBalance * (this.savingsPercent / 100);
  }

  get totalProjected() {
    return this.amountToSavePerBiWeek * this.biWeeks;
  }

  format = (val: number) => {
    return formatCurrency(val);
  };
}
