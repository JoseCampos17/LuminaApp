<script lang="ts">
  import { FinancialInsightsState } from "$lib/logic/FinancialInsightsState.svelte";
  import { uiState } from "$lib/stores/ui.svelte";
  import type { RecurringExpense } from "$lib/types";

  let props = $props<{
    netIncome: number;
    variableExpenses: number;
    recurringExpenses: RecurringExpense[];
    viewMode: string;
    isCurrentPeriod: boolean;
  }>();

  const state = new FinancialInsightsState({
    get netIncome() {
      return props.netIncome;
    },
    get variableExpenses() {
      return props.variableExpenses;
    },
    get recurringExpenses() {
      return props.recurringExpenses;
    },
    get viewMode() {
      return props.viewMode;
    },
  });
</script>

<div class="insights-container">
  {#if state.isNextHeavy}
    <div class="insight-card warning glass-card">
      <div class="icon">⚠️</div>
      <div class="content">
        <h4>¡Alerta de Quincena Pesada!</h4>
        <p>
          Tu próxima quincena tiene gastos fijos más altos. Considera guardar un
          poco más de esta quincena.
        </p>
      </div>
    </div>
  {/if}

  {#if state.totalSalary > 0}
    {#if state.isOverspent}
      <div class="insight-card danger glass-card">
        <div class="icon">🚨</div>
        <div class="content">
          <h4>¡Sobre-ejecución Detectada!</h4>
          <p>Has gastado más de lo que tenías disponible. ¡Pise el freno!</p>
        </div>
      </div>
    {:else}
      <div class="insight-card info glass-card">
        <div class="icon">💡</div>
        <div class="content">
          <h4>Tip de Distribución</h4>
          {#if state.needsPercent > 60}
            <p>
              Tus gastos fijos consumen más del 60% de tus ingresos. Revisa tus
              suscripciones.
            </p>
          {:else if state.spentPercent > 85}
            <p>
              Estás muy cerca de tu límite. Evita gastos hormiga el resto de la
              quincena.
            </p>
          {:else}
            <p>Vas muy bien. Es un buen momento para pensar en el ahorro 🚀.</p>
          {/if}
        </div>
      </div>
    {/if}

    <div class="insight-card strategy glass-card">
      <div class="icon">💳</div>
      <div class="content">
        <h4>Estrategia de Tarjetas</h4>
        <p>
          Divide los pagos de tus tarjetas en dos. Aparta la mitad hoy para que
          el golpe no sea tan fuerte.
        </p>
      </div>
    </div>
  {:else if props.isCurrentPeriod}
    <div
      class="insight-card info glass-card clickable"
      onclick={() => (uiState.activeTab = "settings")}
      onkeydown={(e) => e.key === "Enter" && (uiState.activeTab = "settings")}
      role="button"
      tabindex="0"
    >
      <div class="icon">⚙️</div>
      <div class="content">
        <h4>Configuración pendiente</h4>
        <p>
          Registra tu salario en el icono de engranaje para recibir consejos
          personalizados.
        </p>
      </div>
    </div>
  {/if}
</div>
