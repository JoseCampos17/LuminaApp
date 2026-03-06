<script lang="ts">
  import { CurrencyToggleState } from "$lib/logic/CurrencyToggleState.svelte";
  import type { CurrencyDef } from "$lib/currencies";

  let props = $props<{
    currency?: string;
    currencies?: CurrencyDef[];
    onToggle: (code: string) => void;
  }>();

  const state = new CurrencyToggleState({
    get currenciesProp() {
      return props.currencies;
    },
  });
</script>

<div class="currency-toggle glass-card">
  <span class="label">Moneda:</span>
  <div class="toggle-group">
    {#each state.currencies as cur}
      <button
        class="opt-btn {props.currency === cur.code ? 'active' : ''}"
        onclick={() => props.onToggle(cur.code)}
      >
        {cur.code}
      </button>
    {/each}
  </div>
</div>
