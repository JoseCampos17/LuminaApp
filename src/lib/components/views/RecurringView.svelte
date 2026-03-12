<script lang="ts">
  import SwipeableItem from "$lib/components/ui/SwipeableItem.svelte";

  let {
    dash,
    categoriesState,
    selectedFolder,
    disappearingId,
    lastDragEndTime,
    handleClickEdit,
    openActionMenu,
    openNewFolderModal,
    onDeleteTrigger,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    onFolderSelect,
  } = $props<{
    dash: any;
    categoriesState: any;
    selectedFolder: string | null;
    disappearingId: string | null;
    lastDragEndTime: number;
    handleClickEdit: (exp: any) => void;
    openActionMenu: (
      item: any,
      type: "transaction" | "recurring" | "folder",
    ) => void;
    openNewFolderModal: (name: string | null) => void;
    onDeleteTrigger: (exp: any) => void;
    handleDragStart: (e: DragEvent, index: number) => void;
    handleDragOver: (e: DragEvent) => void;
    handleDrop: (e: DragEvent, index: number) => void;
    handleDragEnd: (e: DragEvent) => void;
    onFolderSelect: (folder: string | null) => void;
  }>();
</script>

<section class="full-history">
  <div class="history-header">
    {#if selectedFolder === null}
      <h2>Categorias</h2>
      {#if dash.isCurrentPeriod()}
        <button class="add-btn-small" onclick={() => openNewFolderModal(null)}>
          + Nueva
        </button>
      {/if}
    {:else}
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button
          class="icon-btn"
          onclick={() => onFolderSelect(null)}
          aria-label="Volver"
          style="background:none;border:none;color:inherit;cursor:pointer;padding:0;"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"
            ></polyline></svg
          >
        </button>
        <h2>{selectedFolder}</h2>
      </div>
      {#if dash.isCurrentPeriod()}
        <button
          class="add-btn-small"
          onclick={() => (dash.ui.showRecurringModal = true)}
        >
          + Agregar
        </button>
      {/if}
    {/if}
  </div>

  {#if selectedFolder === null}
    <div class="folders-grid">
      {#each categoriesState.items as cat, i}
        <div
          class="folder-wrapper"
          draggable="true"
          role="listitem"
          ondragstart={(e) => handleDragStart(e, i)}
          ondragover={handleDragOver}
          ondrop={(e) => handleDrop(e, i)}
          ondragend={handleDragEnd}
        >
          <button
            class="folder-card glass-card"
            onclick={(e) => {
              if (Date.now() - lastDragEndTime < 500) return;
              onFolderSelect(cat.name);
            }}
          >
            <div class="folder-icon">{cat.icon}</div>
            <div class="folder-name">{cat.name}</div>
            <div class="folder-count">
              {dash.finance.recurringExpenses.filter(
                (e: any) =>
                  e.category === cat.name ||
                  (cat.name === "Otros" &&
                    (!e.category || e.category === "Otros")),
              ).length} gastos
            </div>
          </button>
          <button
            class="more-btn"
            style="position: absolute; top: 8px; right: 8px; z-index: 2;"
            onclick={(e) => {
              e.stopPropagation();
              openActionMenu(cat, "folder");
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
        </div>
      {/each}
      <!-- Spacer to ensure last row is visible above bottom nav -->
      <div style="grid-column: span 2; height: 1px;"></div>
    </div>
  {:else}
    <div class="history-container glass-card" style="overflow: hidden;">
      <div class="history-list">
        {#each dash.finance.recurringExpenses.filter((e: any) => e.category === selectedFolder || (selectedFolder === "Otros" && (!e.category || e.category === "Otros"))) as exp}
          <SwipeableItem
            id={exp.id}
            disappearing={disappearingId === exp.id}
            onDeleteTrigger={() => onDeleteTrigger(exp)}
            onclick={() => handleClickEdit(exp)}
          >
            <div
              style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; width: 100%; box-sizing: border-box;"
            >
              <div class="tx-left">
                <span class="tx-desc">{exp.description}</span>
                <span class="tx-meta">
                  <span class="tx-cat-badge">{exp.category || "Otros"}</span>
                  •
                  {#if exp.frequency === "weekly"}
                    Cada {[
                      "Domingo",
                      "Lunes",
                      "Martes",
                      "Miércoles",
                      "Jueves",
                      "Viernes",
                      "Sábado",
                    ][exp.day_of_week ?? 0]}
                  {:else}
                    Día {exp.day_of_month} de cada mes
                  {/if}
                </span>
              </div>
              <div class="tx-right-actions">
                <span class="tx-amount negative">
                  {dash.formatLocalAmount(exp.amount)}
                </span>
                <button
                  class="more-btn"
                  onclick={(e) => {
                    e.stopPropagation();
                    openActionMenu(exp, "recurring");
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
              </div>
            </div>
          </SwipeableItem>
        {/each}
        {#if dash.finance.recurringExpenses.filter((e: any) => e.category === selectedFolder || (selectedFolder === "Otros" && (!e.category || e.category === "Otros"))).length === 0}
          <p class="empty">
            No hay gastos fijos registrados en esta categoría.
          </p>
        {/if}
      </div>
    </div>
  {/if}
</section>

