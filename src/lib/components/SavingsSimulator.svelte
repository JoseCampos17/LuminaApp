<script lang="ts">
  import { SavingsSimulatorState } from "$lib/logic/SavingsSimulatorState.svelte";

  let props = $props<{ availableBalance: number }>();

  const state = new SavingsSimulatorState({
    get availableBalance() {
      return props.availableBalance;
    },
  });
</script>

<div class="simulator-card glass-card" class:warning-state={state.isNegative}>
  <div class="sim-header">
    <h4 class:danger-text={state.isNegative}>
      {state.isNegative
        ? "⚠️ Alerta de Deuda"
        : 'Simulador de Ahorro "What-If" 🚀'}
    </h4>
    <p class="subtitle">
      {state.isNegative
        ? "Tu ritmo de gasto actual es insostenible:"
        : "¿Qué pasa si guardas un poquito hoy?"}
    </p>
  </div>

  {#if !state.isNegative}
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
  {:else}
    <div class="control-box warning-box">
      <div class="label-row">
        <span class="danger-text">Déficit por quincena:</span>
        <span class="save-amount negative"
          >{state.format(state.amountToSavePerBiWeek)}</span
        >
      </div>
      <p class="warning-hint">
        Estás gastando más de lo que recibes. <strong
          >Frena tus gastos variables</strong
        > para evitar que esta deuda crezca.
      </p>
    </div>
  {/if}

  <div class="projection-results" class:danger-bg={state.isNegative}>
    <div class="result-item">
      <span class="period"
        >{state.isNegative
          ? "En 3 meses habrás perdido:"
          : "En 3 meses habrás acumulado:"}</span
      >
      <span
        class="total-amount"
        class:gradient-text={!state.isNegative}
        class:danger={state.isNegative}
        >{state.format(state.totalProjected)}</span
      >
    </div>
    <p class="motivation">
      {#if state.isNegative}
        <span class="danger-text">¡Tu salud financiera está en riesgo! 🛑</span>
      {:else if state.savingsPercent > 50}
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
