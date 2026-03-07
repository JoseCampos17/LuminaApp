<script lang="ts">
  import { RecurringExpensesState } from "$lib/logic/RecurringExpensesState.svelte";

  let props = $props<{
    onUpdated: () => void;
    initialExpense?: any;
    fixedCategory?: string | null;
  }>();

  const recurringState = new RecurringExpensesState({
    get onUpdated() {
      return props.onUpdated;
    },
    get initialExpense() {
      return props.initialExpense;
    },
  });

  import { categoriesState } from "$lib/stores/categories.svelte";

  let selectedCategory = $state("Otros");

  $effect(() => {
    if (props.fixedCategory) {
      selectedCategory = props.fixedCategory;
    } else if (props.initialExpense?.category) {
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
        <option value="daily">Diario</option>
      </select>
    </div>

    {#if recurringState.newFrequency === "monthly"}
      <div class="selector-group">
        <label for="newDayOfMonth">Día del mes</label>
        <select id="newDayOfMonth" bind:value={recurringState.newDayOfMonth}>
          {#each Array.from({ length: 31 }, (_, i) => i + 1) as day}
            <option value={day}>{day}</option>
          {/each}
        </select>
      </div>
    {:else if recurringState.newFrequency === "weekly"}
      <div class="selector-group">
        <label for="newDayOfWeek">Día de la semana</label>
        <select id="newDayOfWeek" bind:value={recurringState.newDayOfWeek}>
          {#each recurringState.daysOfWeek as day}
            <option value={day.v}>{day.l}</option>
          {/each}
        </select>
      </div>
    {/if}

    {#if !props.fixedCategory}
      <div class="selector-group">
        <label for="category-grid">Categoría</label>
        <div id="category-grid" class="category-grid">
          {#each categoriesState.items as cat}
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
    {/if}

    <button
      class="add-btn"
      onclick={() => recurringState.save(selectedCategory)}
    >
      {recurringState.editingId ? "Actualizar" : "Guardar Fijo"}
    </button>
  </div>
</div>
