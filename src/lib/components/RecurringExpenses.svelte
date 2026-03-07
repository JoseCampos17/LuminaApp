<script lang="ts">
  import { RecurringExpensesState } from "$lib/logic/RecurringExpensesState.svelte";

  let props = $props<{ onUpdated: () => void; initialExpense?: any }>();

  const recurringState = new RecurringExpensesState({
    get onUpdated() {
      return props.onUpdated;
    },
    get initialExpense() {
      return props.initialExpense;
    },
  });

  const categories = [
    { name: "Vivienda", icon: "🏠" },
    { name: "Comida", icon: "🥗" },
    { name: "Transporte", icon: "🚌" },
    { name: "Entretenimiento", icon: "🎮" },
    { name: "Salud", icon: "🏥" },
    { name: "Educación", icon: "🎓" },
    { name: "Servicios", icon: "💸" },
    { name: "Seguros", icon: "🛡" },
    { name: "Otros", icon: "🧩" },
  ];

  let selectedCategory = $state("Otros");

  $effect(() => {
    if (props.initialExpense?.category) {
      selectedCategory = props.initialExpense.category;
    } else {
      selectedCategory = "Otros";
    }
  });
</script>

<div class="recurring-manager">
  <div class="add-form">
    <input
      type="text"
      bind:value={recurringState.newDesc}
      placeholder="Ej: Netflix, Arriendo..."
    />
    <input
      type="number"
      bind:value={recurringState.newAmount}
      placeholder="Monto"
    />

    <div class="selector-group">
      <label for="newFrequency">Frecuencia</label>
      <select id="newFrequency" bind:value={recurringState.newFrequency}>
        <option value="monthly">Mensual</option>
        <option value="weekly">Semanal</option>
      </select>
    </div>

    {#if recurringState.newFrequency === "monthly"}
      <div class="selector-group">
        <label for="newDayOfMonth">Día del mes</label>
        <input
          id="newDayOfMonth"
          type="number"
          bind:value={recurringState.newDayOfMonth}
          min="1"
          max="31"
        />
      </div>
    {:else}
      <div class="selector-group">
        <label for="newDayOfWeek">Día de la semana</label>
        <select id="newDayOfWeek" bind:value={recurringState.newDayOfWeek}>
          {#each recurringState.daysOfWeek as day}
            <option value={day.v}>{day.l}</option>
          {/each}
        </select>
      </div>
    {/if}

    <div class="selector-group">
      <label for="category-grid">Categoría</label>
      <div id="category-grid" class="category-grid">
        {#each categories as cat}
          <button
            type="button"
            class="cat-item"
            class:active={selectedCategory === cat.name}
            onclick={() => (selectedCategory = cat.name)}
            title={cat.name}
          >
            <span class="cat-icon">{cat.icon}</span>
            <span class="cat-label">{cat.name}</span>
          </button>
        {/each}
      </div>
    </div>

    <button
      class="save-btn"
      onclick={() => recurringState.save(selectedCategory)}
    >
      {recurringState.editingId ? "Actualizar" : "Guardar Fijo"}
    </button>
  </div>
</div>
