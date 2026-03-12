<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import TransactionForm from "$lib/components/TransactionForm.svelte";
  import type { DashboardState } from "$lib/logic/DashboardState.svelte";

  let { dash }: { dash: DashboardState } = $props();
</script>

<!-- Add Transaction Modal -->
<Modal
  isOpen={dash.ui.showTransactionModal}
  close={() => (dash.ui.showTransactionModal = false)}
  title="¿Qué pasó hoy?"
  minimal={true}
>
  <div style="padding-bottom: 0.5rem;">
    <div style="text-align:center; margin-bottom: 1rem;">
      <div style="font-size: 2rem;">💸</div>
      <h3 style="margin: 4px 0 0; color: var(--text-color);">
        Registrar Movimiento
      </h3>
    </div>
    <TransactionForm onTransactionAdded={dash.handleTransactionAdded} />
  </div>
</Modal>

<!-- Edit Transaction Modal -->
<Modal
  isOpen={dash.ui.showEditModal}
  close={dash.clearEdit}
  title="Editar Movimiento"
  minimal={true}
>
  {#if dash.ui.editingTransaction}
    <div style="padding-bottom: 0.5rem;">
      <div style="text-align:center; margin-bottom: 1rem;">
        <div style="font-size: 2rem;">✏️</div>
        <h3 style="margin: 4px 0 0; color: var(--text-color);">
          Editar Movimiento
        </h3>
      </div>
      <TransactionForm
        editData={dash.ui.editingTransaction}
        onTransactionAdded={dash.handleEditComplete}
      />
    </div>
  {/if}
</Modal>
