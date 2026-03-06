import { saveCurrencies, loadCurrencies, fetchRates } from "$lib/currencies";
import type { CurrencyDef } from "$lib/currencies";

export class CurrencyRatesState {
  constructor(
    private props: {
      get currenciesProp(): CurrencyDef[] | undefined;
      onRatesUpdated: (updated: CurrencyDef[]) => void;
    },
  ) { }

  get currencies() {
    return this.props.currenciesProp && this.props.currenciesProp.length > 0
      ? this.props.currenciesProp
      : loadCurrencies();
  }
}
