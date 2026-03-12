<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import RecurringExpenses from "$lib/components/RecurringExpenses.svelte";
  import type { DashboardState } from "$lib/logic/DashboardState.svelte";

  let {
    dash,
    selectedFolder,
  }: { dash: DashboardState; selectedFolder: string | null } = $props();
</script>

<Modal
  isOpen={dash.ui.showRecurringModal}
  close={() => {
    dash.ui.showRecurringModal = false;
    dash.ui.editingRecurring = null;
  }}
  title={dash.ui.editingRecurring
    ? "Editar Gasto Fijo"
    : "Gestionar Gasto Fijo"}
  minimal={true}
>
  <div style="padding-bottom: 0.5rem;">
    <div style="text-align:center; margin-bottom: 1rem;">
      <div style="font-size: 2rem;">
        {dash.ui.editingRecurring ? "✏️" : "📌"}
      </div>
      <h3 style="margin: 4px 0 0; color: var(--text-color);">
        {dash.ui.editingRecurring ? "Editar Gasto Fijo" : "Nuevo Gasto Fijo"}
      </h3>
    </div>
    <RecurringExpenses
      onUpdated={() => {
        dash.ui.showRecurringModal = false;
        dash.loadData();
      }}
      initialExpense={dash.ui.editingRecurring}
      fixedCategory={selectedFolder}
    />
  </div>
</Modal>
