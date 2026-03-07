<script lang="ts">
  import { SalaryConfigState } from "$lib/logic/SalaryConfigState.svelte";
  import { openInfoModal } from "$lib/stores/ui.svelte";
  import type { CurrencyDef } from "$lib/currencies";

  let props = $props<{
    onSalaryUpdated: () => void;
    currency?: string;
    currencies?: CurrencyDef[];
  }>();

  const state = new SalaryConfigState({
    get onSalaryUpdated() {
      return props.onSalaryUpdated;
    },
    get currency() {
      return props.currency || "COP";
    },
    get currencies() {
      return props.currencies;
    },
  });
</script>

<div class="salary-box glass-card" data-editing={state.isEditing}>
  <div class="info">
    <div class="header-row">
      <span class="label">
        Tu Salario en {props.currency} 💰
        <button
          type="button"
          class="info-icon"
          onclick={() =>
            openInfoModal(
              "Tu Salario",
              "Tu ingreso recurrente principal. Se usa para calcular tu Liquidez en el radar y tu Presupuesto Disponible en la quincena o mes.",
            )}
          aria-label="Más información sobre el salario"
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
      <div class="frequency-pill">
        <button
          class="pill-opt {(state.isEditing
            ? state.editFrequency
            : state.salaryFrequency) === 'quincena'
            ? 'active'
            : ''}"
          onclick={() => {
            if (state.isEditing) state.editFrequency = "quincena";
          }}
        >
          Quincenal
        </button>
        <button
          class="pill-opt {(state.isEditing
            ? state.editFrequency
            : state.salaryFrequency) === 'mes'
            ? 'active'
            : ''}"
          onclick={() => {
            if (state.isEditing) state.editFrequency = "mes";
          }}
        >
          Mensual
        </button>
      </div>
    </div>

    {#if state.isEditing}
      <div class="edit-mode">
        <input
          type="number"
          bind:value={state.editValue}
          placeholder="Monto {props.currency}"
          min="0"
          onfocus={(e) => e.currentTarget.select()}
        />
        <button class="save-btn" onclick={state.saveSalary}>Guardar</button>
      </div>
    {:else}
      <div class="view-mode">
        <span class="amount">
          {(() => {
            const def = (props.currencies || []).find(
              (c: CurrencyDef) => c.code === props.currency,
            ) || { locale: "es-CO", decimals: 0 };
            return new Intl.NumberFormat(def.locale, {
              style: "currency",
              currency: props.currency,
              maximumFractionDigits: def.decimals,
            }).format(state.displayAmount);
          })()}
        </span>
        <button class="edit-btn" onclick={state.startEdit}>Cambiar</button>
      </div>
    {/if}
  </div>
  {#if state.displayAmount === 0}
    <p class="hint">
      Configura el monto en la moneda activa. Se convertirá automáticamente en
      el radar.
    </p>
  {/if}
</div>
