<script lang="ts">
  import PeriodSelector from "$lib/components/PeriodSelector.svelte";
  import SwipeableItem from "$lib/components/ui/SwipeableItem.svelte";
  import CategoryChart from "$lib/components/CategoryChart.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { CategoryChartState } from "$lib/logic/CategoryChartState.svelte";

  let {
    dash,
    monthNames,
    txDisappearingId,
    visibleRecords,
    handleScroll,
    onEditTransaction,
    onDeleteTrigger,
    onActionMenu,
  } = $props<{
    dash: any;
    monthNames: string[];
    txDisappearingId: string | null;
    visibleRecords: number;
    handleScroll: (e: Event) => void;
    onEditTransaction: (tx: any) => void;
    onDeleteTrigger: (tx: any) => void;
    onActionMenu: (
      tx: any,
      type: "transaction" | "recurring" | "folder",
    ) => void;
  }>();

  let selectedCategory = $state<string | null>(null);
  let showChartModal = $state(false);

  const chartState = new CategoryChartState({
    get transactions() {
      return dash.currentPeriodTransactions().filter(
        (t: any) => !String(t.id).startsWith("virtual-salary"),
      );
    },
  });

  function filteredTransactions() {
    const all = dash.currentPeriodTransactions();
    if (!selectedCategory) return all;
    return all.filter(
      (t: any) => (t.category || "Sin categoría") === selectedCategory,
    );
  }
</script>

<section class="full-history">
  <div
    class="history-header"
    style="display: flex; justify-content: space-between; align-items: center; width: 100%;"
  >
    <h2>Historial de Movimientos</h2>
    <div class="actions" style="display:flex;gap:8px;align-items:center;">
      <button
        class="chip {showChartModal ? 'active' : ''}"
        onclick={() => (showChartModal = true)}
        title="Ver gráfica por categoría"
        aria-label="Abrir gráfica de categorías"
      >
        📊
      </button>
      <PeriodSelector />
    </div>
  </div>

  <!-- Category filter chips -->
  {#if chartState.categories.length > 1}
    <div class="category-chips">
      <button
        class="chip {selectedCategory === null ? 'active' : ''}"
        onclick={() => (selectedCategory = null)}
      >
        Todo
      </button>
      {#each chartState.categories as cat}
        <button
          class="chip {selectedCategory === cat ? 'active' : ''}"
          onclick={() => (selectedCategory = selectedCategory === cat ? null : cat)}
        >
          {cat}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Transaction list — always full height -->
  <div class="history-container glass-card">
    <div class="history-list" onscroll={handleScroll}>
      {#each filteredTransactions().slice(0, visibleRecords) as tx}
        <SwipeableItem
          id={tx.id}
          disabled={String(tx.id).startsWith("virtual-salary")}
          disappearing={txDisappearingId === tx.id}
          onDeleteTrigger={() => onDeleteTrigger(tx)}
          onclick={() =>
            !String(tx.id).startsWith("virtual-salary") &&
            onEditTransaction(tx)}
        >
          <div class="tx-item-content">
            <div class="tx-left">
              <span class="tx-desc">{tx.description || "Sin descripción"}</span>
              <span class="tx-meta">{tx.category} • {tx.date}</span>
            </div>
            <div class="tx-right-actions">
              <span class="tx-amount {tx.amount > 0 ? 'positive' : 'negative'}">
                {tx.amount > 0 ? "+" : ""}{dash.formatLocalAmount(tx.amount)}
              </span>
              {#if !String(tx.id).startsWith("virtual-salary")}
                <button
                  class="more-btn"
                  onclick={(e) => {
                    e.stopPropagation();
                    onActionMenu(tx, "transaction");
                  }}
                  aria-label="Más acciones"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="18"
                    height="18"
                  >
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              {/if}
            </div>
          </div>
        </SwipeableItem>
      {/each}
      {#if filteredTransactions().length === 0}
        <p class="empty">
          {selectedCategory
            ? `Sin movimientos en "${selectedCategory}".`
            : `No hay movimientos en ${monthNames[dash.finance.selectedMonth]} de ${dash.finance.selectedYear}.`}
        </p>
      {/if}
    </div>
  </div>
</section>

<!-- Chart Modal -->
<Modal isOpen={showChartModal} close={() => (showChartModal = false)} title="Gastos por Categoría 📊">
  <CategoryChart
    slices={chartState.slices}
    totalExpenses={chartState.totalExpenses}
    formatAmount={(n) => dash.formatLocalAmount(n)}
  />
</Modal>
