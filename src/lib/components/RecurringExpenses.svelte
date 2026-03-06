<script lang="ts">
  import { RecurringExpensesState } from "$lib/logic/RecurringExpensesState.svelte";

  let props = $props<{ onUpdated: () => void; initialExpense?: any }>();

  const state = new RecurringExpensesState({
    get onUpdated() {
      return props.onUpdated;
    },
    get initialExpense() {
      return props.initialExpense;
    },
  });
</script>

<div class="recurring-manager">
  <div class="add-form">
    <input
      type="text"
      bind:value={state.newDesc}
      placeholder="Ej: Netflix, Arriendo..."
    />
    <input type="number" bind:value={state.newAmount} placeholder="Monto" />

    <div class="selector-group">
      <label for="newFrequency">Frecuencia</label>
      <select id="newFrequency" bind:value={state.newFrequency}>
        <option value="monthly">Mensual</option>
        <option value="weekly">Semanal</option>
      </select>
    </div>

    {#if state.newFrequency === "monthly"}
      <div class="selector-group">
        <label for="newDayOfMonth">Día del mes</label>
        <input
          id="newDayOfMonth"
          type="number"
          bind:value={state.newDayOfMonth}
          min="1"
          max="31"
        />
      </div>
    {:else}
      <div class="selector-group">
        <label for="newDayOfWeek">Día de la semana</label>
        <select id="newDayOfWeek" bind:value={state.newDayOfWeek}>
          {#each state.daysOfWeek as day}
            <option value={day.v}>{day.l}</option>
          {/each}
        </select>
      </div>
    {/if}

    <button class="save-btn" onclick={state.save}>
      {state.editingId ? "Actualizar" : "Guardar Fijo"}
    </button>
  </div>
</div>
