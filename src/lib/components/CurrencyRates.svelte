<script lang="ts">
  import { financeState } from "$lib/stores/finance.svelte";
  import type { CurrencyDef } from "$lib/currencies";

  let props = $props<{
    currencies?: CurrencyDef[];
  }>();

  // Find the rate for the currently selected local currency
  let activeRate = $derived(() => {
    const curs = props.currencies || financeState.currencies;
    return curs.find((c) => c.code === financeState.localCurrency);
  });
</script>

{#if activeRate()}
  <div class="active-rate-container">
    <div class="rate-badge glass-card">
      <div class="usd-label">1 USD</div>
      <div class="divider"></div>
      <div class="local-rate">
        <span class="symbol">$</span>
        <span class="value">{activeRate().rateToUsd.toLocaleString()}</span>
        <span class="code">{activeRate().code}</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .active-rate-container {
    display: flex;
    justify-content: center;
    padding: 0 0 20px 0;
  }

  .rate-badge {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 24px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--glass-border);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .rate-badge:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-4px) scale(1.02);
    border-color: var(--neon-blue);
    box-shadow: 0 12px 40px rgba(0, 243, 255, 0.15);
  }

  .usd-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-dim);
    letter-spacing: 0.1em;
  }

  .divider {
    width: 1px;
    height: 20px;
    background: var(--glass-border);
  }

  .local-rate {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .symbol {
    font-size: 0.8rem;
    color: var(--neon-blue);
    font-weight: 800;
  }

  .value {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-color);
    font-family: "JetBrains Mono", monospace;
    letter-spacing: -0.02em;
  }

  .code {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--neon-blue);
    margin-left: 4px;
  }
</style>
