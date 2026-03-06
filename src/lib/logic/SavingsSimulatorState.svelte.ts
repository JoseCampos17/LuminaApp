export class SavingsSimulatorState {
  savingsPercent = $state(20);
  months = 3;
  biWeeks = 6;

  constructor(private props: { get availableBalance(): number }) {
    this.biWeeks = this.months * 2;
  }

  get amountToSavePerBiWeek() {
    return this.props.availableBalance * (this.savingsPercent / 100);
  }

  get totalProjected() {
    return this.amountToSavePerBiWeek * this.biWeeks;
  }

  format = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };
}
