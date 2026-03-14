<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import SalaryConfig from "$lib/components/SalaryConfig.svelte";
  import SalaryHistory from "$lib/components/SalaryHistory.svelte";
  import { migrateCurrency, clearAllData } from "$lib/stores/finance.svelte";

  let { dash } = $props<{ dash: any }>();

  let showCurrencyConfirmModal = $state(false);
  let pendingCurrency = $state<string | null>(null);
  let showClearAllConfirmModal = $state(false);
  let showHistoryModal = $state(false);

  let salaryReloadFn: (() => void) | null = null;
  let historyCmp: any;

  $effect(() => {
    if (dash.ui.activeTab === "settings") {
      if (salaryReloadFn) salaryReloadFn();
      if (historyCmp && historyCmp.loadHistory) historyCmp.loadHistory();
    }
  });

  function handleCurrencySelection(opt: string) {
    if (dash.finance.localCurrency === opt) return;
    pendingCurrency = opt;
    showCurrencyConfirmModal = true;
  }

  async function confirmCurrencyChange() {
    if (pendingCurrency) {
      const oldCurrency = dash.finance.localCurrency;
      await migrateCurrency(oldCurrency, pendingCurrency);
      showCurrencyConfirmModal = false;
      pendingCurrency = null;
    }
  }

  async function confirmClearAll() {
    await clearAllData();
    showClearAllConfirmModal = false;
    dash.ui.activeTab = "home"; // Take user home after reset
  }
</script>

<section class="full-settings">
  <div class="settings-content">
    <div class="local-currency-box glass-card">
      <span class="label">
        Divisa Local 🌍
        <button
          type="button"
          class="info-icon"
          onclick={() => {
            dash.ui.infoModalTitle = "Divisa Local";
            dash.ui.infoModalText =
              "La divisa local es la moneda principal que usa Lumina para tus cálculos. 🔄 Si la cambias, tus movimientos, gastos fijos y salario se convertirán automáticamente al tipo de cambio actual.";
            dash.ui.showInfoModal = true;
          }}
          aria-label="Más información sobre Divisa Local"
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
      </span>
      <div class="currency-options">
        {#each ["COP", "CLP", "USD"] as opt}
          <button
            class="currency-opt-btn {dash.finance.localCurrency === opt
              ? 'active'
              : ''}"
            onclick={() => handleCurrencySelection(opt)}>{opt}</button
          >
        {/each}
      </div>
    </div>

    <SalaryConfig
      currency={dash.finance.localCurrency}
      currencies={dash.finance.currencies}
      onSalaryUpdated={() => {
        dash.loadData();
        if (historyCmp && historyCmp.loadHistory) historyCmp.loadHistory();
      }}
      onActivate={(fn) => {
        salaryReloadFn = fn;
      }}
    />
    {#if dash.finance.salaryUSD === 0 && dash.isCurrentPeriod()}
      <div class="glass-card" style="text-align: center; padding: 20px;">
        <p style="color: var(--text-dim); margin-bottom: 15px;">
          No se ha registrado sueldo para este mes.
        </p>
      </div>
    {/if}

    <div class="local-currency-box glass-card" style="margin-top: 15px;">
      <span class="label">Historial de Salarios 📅</span>
      <p style="color: var(--text-dim); font-size: 0.9rem; margin: 5px 0 15px 0;">
        Revisa los cambios que has hecho en tu sueldo a través del tiempo.
      </p>
      <button
        class="add-btn"
        style="width: 100%; border: 1px solid rgba(255,255,255,0.1);"
        onclick={() => {
          showHistoryModal = true;
          if (historyCmp && historyCmp.loadHistory) historyCmp.loadHistory();
        }}
        >
        Ver Historial
      </button>
    </div>

    <div
      class="local-currency-box glass-card"
      style="margin-top: 15px; border-color: rgba(255, 60, 60, 0.2);"
    >
      <span class="label" style="color: #ff4d4d;">
        Zona de Peligro ⚠️
        <button
          type="button"
          class="info-icon"
          onclick={() => {
            dash.ui.infoModalTitle = "Limpiar Todo";
            dash.ui.infoModalText =
              "Esta acción eliminará permanentemente todos tus movimientos, gastos fijos y la configuración de tu salario. La aplicación quedará como nueva.";
            dash.ui.showInfoModal = true;
          }}
          aria-label="Más información sobre Limpiar Todo"
          ><svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            ><circle
              cx="12"
              cy="12"
              r="10"
              stroke="#ff4d4d"
              stroke-width="1.5"
            /><path
              d="M12 17v-5"
              stroke="#ff4d4d"
              stroke-width="1.8"
              stroke-linecap="round"
            /><circle
              cx="12"
              cy="7.5"
              r="1"
              fill="#ff4d4d"
              stroke="none"
            /></svg
          ></button
        >
      </span>
      <div style="margin-top: 10px;">
        <button
          class="add-btn"
          style="background: rgba(255, 60, 60, 0.2); color: #ff4d4d; border: 1px solid rgba(255, 60, 60, 0.3);"
          onclick={() => (showClearAllConfirmModal = true)}
          >Limpiar Todos los Datos</button
        >
      </div>
    </div>
  </div>
</section>

<!-- Salary History Modal -->
<Modal
  isOpen={showHistoryModal}
  close={() => (showHistoryModal = false)}
  title="Historial de Salarios"
>
  <div style="margin-top: 10px;">
    <SalaryHistory bind:this={historyCmp} />
  </div>
</Modal>

<!-- Confirm Currency Change Modal -->
<Modal
  isOpen={showCurrencyConfirmModal}
  close={() => (showCurrencyConfirmModal = false)}
  title="¿Confirmar Cambio de Divisa?"
  minimal={true}
>
  <div style="text-align: center;">
    <div style="font-size: 2.5rem; margin-bottom: 10px;">🔄</div>
    <h3 style="margin: 0 0 10px;">¿Convertir a {pendingCurrency}?</h3>
    <p style="margin-bottom: 25px; color: var(--text-dim);">
      Al cambiar la divisa local, <strong>convertiremos automáticamente</strong>
      todos tus movimientos, gastos fijos y salario al tipo de cambio actual.<br
      /><br />
      Tus datos permanecerán intactos, pero expresados en {pendingCurrency}.
    </p>
    <div style="display: flex; gap: 1rem; justify-content: center;">
      <button
        class="add-btn"
        style="background: var(--surface-light); color: var(--text-color); flex: 1;"
        onclick={() => (showCurrencyConfirmModal = false)}>Cancelar</button
      >
      <button class="add-btn" style="flex: 1;" onclick={confirmCurrencyChange}
        >Confirmar y Convertir</button
      >
    </div>
  </div>
</Modal>

<!-- Confirm Clear All Data Modal -->
<Modal
  isOpen={showClearAllConfirmModal}
  close={() => (showClearAllConfirmModal = false)}
  title="¿Limpiar Todo el Sistema?"
  minimal={true}
>
  <div style="text-align: center;">
    <div style="font-size: 2.5rem; margin-bottom: 10px;">💣</div>
    <h3 style="margin: 0 0 10px; color: #ff4d4d;">¡Atención!</h3>
    <p style="margin-bottom: 25px; color: var(--text-dim);">
      Estás a punto de <strong>borrar absolutamente todo</strong>.<br /><br />
      Esta acción no se puede deshacer. ¿Deseas continuar?
    </p>
    <div style="display: flex; gap: 1rem; justify-content: center;">
      <button
        class="add-btn"
        style="background: var(--surface-light); color: var(--text-color); flex: 1;"
        onclick={() => (showClearAllConfirmModal = false)}>Cancelar</button
      >
      <button
        class="add-btn"
        style="background: #ff4d4d; color: white; flex: 1;"
        onclick={confirmClearAll}>Borrar Todo</button
      >
    </div>
  </div>
</Modal>
