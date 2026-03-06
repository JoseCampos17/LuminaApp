import { loadCurrencies } from "$lib/currencies";
import type { CurrencyDef } from "$lib/currencies";

export class CurrencyToggleState {
  constructor(
    private props: {
      get currenciesProp(): CurrencyDef[] | undefined;
    },
  ) {}

  get currencies() {
    return this.props.currenciesProp && this.props.currenciesProp.length > 0
      ? this.props.currenciesProp
      : loadCurrencies();
  }
}
