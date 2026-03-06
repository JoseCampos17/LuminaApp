<script lang="ts">
  import { SavingsSimulatorState } from "$lib/logic/SavingsSimulatorState.svelte";

  let props = $props<{ availableBalance: number }>();

  const state = new SavingsSimulatorState({
    get availableBalance() {
      return props.availableBalance;
    },
  });
</script>

<div class="simulator-card glass-card">
  <div class="sim-header">
    <h4>Simulador de Ahorro "What-If" 🚀</h4>
    <p class="subtitle">¿Qué pasa si guardas un poquito hoy?</p>
  </div>

  <div class="control-box">
    <div class="label-row">
      <span>Si ahorras el <strong>{state.savingsPercent}%</strong></span>
      <span class="save-amount"
        >{state.format(state.amountToSavePerBiWeek)} / quincena</span
      >
    </div>
    <input
      type="range"
      min="0"
      max="100"
      bind:value={state.savingsPercent}
      class="slider"
    />
  </div>

  <div class="projection-results">
    <div class="result-item">
      <span class="period">En 3 meses habrás acumulado:</span>
      <span class="total-amount gradient-text"
        >{state.format(state.totalProjected)}</span
      >
    </div>
    <p class="motivation">
      {#if state.savingsPercent > 50}
        ¡Vas por el camino ninja de las finanzas! 🥷
      {:else if state.savingsPercent > 20}
        Un ritmo sólido para construir tu futuro. 📈
      {:else if state.savingsPercent > 0}
        Poco a poco se llena el marranito. 🐷
      {:else}
        Empieza con un 1%, ¡el primer paso es el más duro!
      {/if}
    </p>
  </div>
</div>
