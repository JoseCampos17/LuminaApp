export interface CurrencyDef {
  code: string;    // ISO currency code, e.g. "COP", "CLP", "USD"
  locale: string;  // BCP 47 locale for Intl.NumberFormat, e.g. "es-CO"
  decimals: number; // max fraction digits
  rateToUsd: number; // how many local units = 1 USD. USD itself = 1.
}

/** Default built-in currencies. */
export const DEFAULT_CURRENCIES: CurrencyDef[] = [
  { code: "USD", locale: "en-US", decimals: 2, rateToUsd: 1 },
  { code: "COP", locale: "es-CO", decimals: 0, rateToUsd: 4000 },
  { code: "CLP", locale: "es-CL", decimals: 0, rateToUsd: 940 },
];

const LS_KEY = "lumina_currency_rates";

/** Load currencies, applying any user-saved custom rates over the defaults. */
export function loadCurrencies(): CurrencyDef[] {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (!saved) return DEFAULT_CURRENCIES;
    const savedRates: Record<string, number> = JSON.parse(saved);
    return DEFAULT_CURRENCIES.map(c => ({
      ...c,
      rateToUsd: savedRates[c.code] ?? c.rateToUsd,
    }));
  } catch {
    return DEFAULT_CURRENCIES;
  }
}

/** Persist custom rates (only the rateToUsd per code, not the full struct). */
export function saveCurrencies(currencies: CurrencyDef[]): void {
  const rates: Record<string, number> = {};
  for (const c of currencies) {
    rates[c.code] = c.rateToUsd;
  }
  localStorage.setItem(LS_KEY, JSON.stringify(rates));
}

const LS_FETCH_KEY = "lumina_last_rate_fetch";

/** Fetch latest rates from free API and update localStorage. 
 *  Checks if 4 hours have passed since last fetch unless 'force' is true. 
 */
export async function fetchRates(force = false): Promise<CurrencyDef[]> {
  try {
    if (!force) {
      const lastFetch = localStorage.getItem(LS_FETCH_KEY);
      if (lastFetch) {
        const lastTime = parseInt(lastFetch, 10);
        const now = Date.now();
        const fourHours = 4 * 60 * 60 * 1000;
        if (now - lastTime < fourHours) {
          console.log("[currencies] Using cached rates (less than 4h old)");
          return loadCurrencies();
        }
      }
    }

    console.log("[currencies] Fetching fresh rates from API...");
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await response.json();
    if (data.result === "success") {
      const rates = data.rates;
      const updated = DEFAULT_CURRENCIES.map(c => ({
        ...c,
        rateToUsd: rates[c.code] ?? c.rateToUsd,
      }));
      saveCurrencies(updated);
      localStorage.setItem(LS_FETCH_KEY, Date.now().toString());
      return updated;
    }
  } catch (e) {
    console.error("[currencies] Failed to fetch rates:", e);
  }
  return loadCurrencies();
}

/** Convert an amount denominated in `fromCurrency` to USD. */
export function toUSD(amount: number, fromCode: string, currencies?: CurrencyDef[]): number {
  const curs = (currencies && currencies.length > 0) ? currencies : DEFAULT_CURRENCIES;
  if (fromCode === "USD") return amount;
  const def = curs.find(c => c.code === fromCode);
  if (!def) return amount;
  return amount / def.rateToUsd;
}

/** Convert a USD amount to the target display currency. */
export function fromUSD(usdAmount: number, toCode: string, currencies?: CurrencyDef[]): number {
  const curs = (currencies && currencies.length > 0) ? currencies : DEFAULT_CURRENCIES;
  if (toCode === "USD") return usdAmount;
  const def = curs.find(c => c.code === toCode);
  if (!def) return usdAmount;
  return usdAmount * def.rateToUsd;
}

/** Format a USD amount into the target display currency string. */
export function formatAmount(usdAmount: number, displayCode: string, currencies?: CurrencyDef[]): string {
  const curs = (currencies && currencies.length > 0) ? currencies : DEFAULT_CURRENCIES;
  const def = curs.find(c => c.code === displayCode);
  if (!def) return String(usdAmount);
  const value = fromUSD(usdAmount, displayCode, curs);
  return new Intl.NumberFormat(def.locale, {
    style: "currency",
    currency: displayCode,
    maximumFractionDigits: def.decimals,
  }).format(value);
}

/** Get the CurrencyDef for a given code (or USD as fallback). */
export function getCurrency(code: string, currencies?: CurrencyDef[]): CurrencyDef {
  const curs = (currencies && currencies.length > 0) ? currencies : DEFAULT_CURRENCIES;
  return curs.find(c => c.code === code) ?? curs[0];
}
