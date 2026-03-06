<script lang="ts">
  import { SalaryConfigState } from "$lib/logic/SalaryConfigState.svelte";
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

<div class="salary-box glass-card">
  <div class="info">
    <span class="label">Tu Salario Quincenal en {props.currency} 💰</span>
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
          {new Intl.NumberFormat(props.currency === "USD" ? "en-US" : "es-CO", {
            style: "currency",
            currency: props.currency,
            maximumFractionDigits: props.currency === "USD" ? 2 : 0,
          }).format(state.displayAmount)}
        </span>
        <button class="edit-btn" onclick={state.startEdit}>Cambiar</button>
      </div>
    {/if}
  </div>
  <p class="hint">
    Configura el monto en la moneda activa. Se convertirá automáticamente en el
    radar.
  </p>
</div>
