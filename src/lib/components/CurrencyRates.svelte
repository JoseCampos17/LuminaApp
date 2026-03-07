<script lang="ts">
  import { financeState } from "$lib/stores/finance.svelte";
  import { openInfoModal } from "$lib/stores/ui.svelte";
  import type { CurrencyDef } from "$lib/currencies";

  let props = $props<{
    currencies?: CurrencyDef[];
  }>();

  // Find the rate for the currently selected local currency
  let activeRate = $derived(() => {
    const curs = props.currencies || financeState.currencies;
    return curs.find((c: CurrencyDef) => c.code === financeState.localCurrency);
  });
</script>

{#if activeRate()}
  <div class="active-rate-container">
    <div class="rate-badge glass-card">
      <div class="usd-label">
        1 USD
        <button
          type="button"
          class="info-icon"
          onclick={() =>
            openInfoModal(
              "Tasa de Cambio (TRM)",
              "Esta es la tasa de cambio actual. Se usa para convertir los valores de tu divisa local (COP, CLP) a USD y viceversa en toda la app.",
            )}
          aria-label="Más información sobre TRM"
          ><svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            ><circle cx="12" cy="12" r="10" stroke-width="1.5" /><path
              d="M12 17v-5"
              stroke-width="1.8"
              stroke-linecap="round"
            /><circle
              cx="12"
              cy="7.5"
              r="1"
              fill="currentColor"
              stroke="none"
            /></svg
          ></button
        >
      </div>
      <div class="divider"></div>
      <div class="local-rate">
        <span class="symbol">$</span>
        <span class="value">{activeRate().rateToUsd.toLocaleString()}</span>
        <span class="code">{activeRate().code}</span>
      </div>
    </div>
  </div>
{/if}
