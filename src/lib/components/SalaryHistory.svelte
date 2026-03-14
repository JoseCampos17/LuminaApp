<script lang="ts">
  import { SalaryHistoryState } from "$lib/logic/SalaryHistoryState.svelte";
  import { formatLocalAmount } from "$lib/stores/finance.svelte";
  import Modal from "$lib/components/Modal.svelte";

  const state = new SalaryHistoryState();

  // Expose refreshHistory so the Settings tab can trigger a refresh
  export const loadHistory = () => state.refreshHistory();
</script>

<div class="salary-history-container" onscroll={(e) => {
  const t = e.currentTarget;
  if (t.scrollHeight - t.scrollTop <= t.clientHeight + 50) {
    if (state.hasMore && !state.isLoadingMore) {
      state.loadMore();
    }
  }
}}>
  {#if state.isLoading}
    <p class="empty-state">Cargando historial...</p>
  {:else if state.history.length === 0}
    <p class="empty-state">No hay registros de salarios anteriores.</p>
  {:else}
    <div class="history-list">
      {#each state.history as record}
        <div class="history-item glass-card">
          <div class="record-info">
            <span class="record-date">{record.effective_date}</span>
            <span class="record-freq">{record.frequency === 'quincena' ? 'Quincenal' : 'Mensual'}</span>
          </div>
          <div class="record-amount-actions">
            <span class="record-amount">{formatLocalAmount(record.amount)}</span>
            {#if record.id === state.history[0]?.id}
              <button class="delete-btn" onclick={() => state.deleteRecord(record.id)} aria-label="Eliminar último registro" title="Eliminar último registro">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                </svg>
              </button>
             {:else}
              <div class="delete-spacer" style="width: 28px;"></div>
             {/if}
          </div>
        </div>
      {/each}
      {#if state.isLoadingMore}
        <p style="text-align: center; color: var(--text-dim); font-size: 0.8rem; padding: 10px;">Cargando más...</p>
      {/if}
    </div>
  {/if}
</div>

<!-- Confirm Delete Modal -->
<Modal
  isOpen={state.showDeleteConfirmModal}
  close={state.cancelDelete}
  title="¿Eliminar Registro?"
  minimal={true}
  zIndex={1100}
>
  <div style="text-align: center;">
    <div style="font-size: 2.5rem; margin-bottom: 10px;">🗑️</div>
    <h3 style="margin: 0 0 10px; color: #ff4d4d;">¿Estás seguro?</h3>
    <p style="margin-bottom: 25px; color: var(--text-dim);">
      El registro salarial seleccionado será eliminado permanentemente de tu historial.
    </p>
    <div style="display: flex; gap: 1rem; justify-content: center;">
      <button
        class="add-btn"
        style="background: var(--surface-light); color: var(--text-color); flex: 1;"
        onclick={state.cancelDelete}>Cancelar</button
      >
      <button
        class="add-btn"
        style="background: #ff4d4d; color: white; flex: 1;"
        onclick={state.confirmDelete}>Eliminar</button
      >
    </div>
  </div>
</Modal>

<!-- Error Modal -->
<Modal
  isOpen={state.showErrorModal}
  close={() => (state.showErrorModal = false)}
  title="Acción no permitida"
  minimal={true}
  zIndex={1100}
>
  <div style="text-align: center;">
    <div style="font-size: 2.5rem; margin-bottom: 10px;">🔒</div>
    <h3 style="margin: 0 0 10px;">No es posible eliminar</h3>
    <p style="margin-bottom: 25px; color: var(--text-dim);">
      {state.errorMessage}
    </p>
    <div style="display: flex; justify-content: center;">
      <button
        class="add-btn"
        style="background: var(--surface-light); color: var(--text-color); min-width: 120px;"
        onclick={() => (state.showErrorModal = false)}>Entendido</button
      >
    </div>
  </div>
</Modal>


