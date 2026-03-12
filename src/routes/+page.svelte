<script lang="ts">
  import { DashboardState } from "$lib/logic/DashboardState.svelte";
  import { deleteTransaction } from "$lib/stores/finance.svelte";

  // ── Components ────────────────────────────────────────────────────────────
  import BottomNav from "$lib/components/BottomNav.svelte";
  import TopNav from "$lib/components/ui/TopNav.svelte";
  import ActionMenu from "$lib/components/ui/ActionMenu.svelte";
  import HomeView from "$lib/components/views/HomeView.svelte";
  import HistoryView from "$lib/components/views/HistoryView.svelte";
  import RecurringView from "$lib/components/views/RecurringView.svelte";
  import SettingsView from "$lib/components/views/SettingsView.svelte";

  const dash = new DashboardState();
  let fabOpen = $state(false);

  // Pagination state
  let pageSize = 15;
  let visibleRecords = $state(pageSize);

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  function loadMore() {
    visibleRecords += pageSize;
  }

  function handleScroll(e: Event) {
    const target = e.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    // Check if we are near the bottom (within 20px)
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      if (visibleRecords < dash.currentPeriodTransactions().length) {
        loadMore();
      }
    }
  }

  // Reload data when period changes to ensure correct historical salary

  // ─── Swipe to Delete Action State ──────────────────────────────
  let showRecurringDeleteModal = $state(false);
  let showRecurringEditModal = $state(false);
  let recurringActionTarget = $state<any>(null);

  // ─── Swipe to Delete State (Recurring) ─────────────────────────
  let swipingId = $state<string | null>(null);
  let swipeOffset = $state<number>(0);
  let disappearingId = $state<string | null>(null);

  function handleTouchStart(e: TouchEvent | MouseEvent, id: string) {
    if (dash.ui.activeTab !== "recurring") return;
    swipingId = id;
    const clientX =
      window.TouchEvent && e instanceof TouchEvent
        ? e.touches[0].clientX
        : (e as MouseEvent).clientX;
    (e.currentTarget as HTMLElement)?.setAttribute(
      "data-start-x",
      clientX.toString(),
    );
  }

  function handleTouchMove(e: TouchEvent | MouseEvent) {
    if (!swipingId) return;
    const startX = parseFloat(
      (e.currentTarget as HTMLElement)?.getAttribute("data-start-x") || "0",
    );
    const clientX =
      window.TouchEvent && e instanceof TouchEvent
        ? e.touches[0].clientX
        : (e as MouseEvent).clientX;
    const diff = clientX - startX;

    // Only allow swiping left
    if (diff < 0) {
      swipeOffset = Math.max(diff, -150); // limit swipe distance
    } else {
      swipeOffset = 0;
    }
  }

  function handleTouchEnd(e: TouchEvent | MouseEvent, exp: any) {
    if (!swipingId) return;

    if (swipeOffset <= -80) {
      // Threshold met, trigger delete confirmation via custom Modal
      recurringActionTarget = exp;
      showRecurringDeleteModal = true;
    } else {
      // Threshold not met, snap back
      swipingId = null;
      swipeOffset = 0;
    }
  }

  async function confirmRecurringDelete() {
    if (recurringActionTarget) {
      disappearingId = recurringActionTarget.id;
      showRecurringDeleteModal = false;
      setTimeout(async () => {
        await import("../lib/tauri").then((m) =>
          m.invoke("delete_recurring_expense", {
            id: recurringActionTarget.id,
          }),
        );
        await dash.loadData();
        disappearingId = null;
        swipingId = null;
        swipeOffset = 0;
        recurringActionTarget = null;
      }, 300); // Wait for shatter animation
    }
  }

  function cancelRecurringAction() {
    showRecurringDeleteModal = false;
    showRecurringEditModal = false;
    swipingId = null;
    swipeOffset = 0;
    recurringActionTarget = null;
  }

  function handleClickEdit(exp: any) {
    // Don't trigger click if we are swiping
    if (swipeOffset < -10) return;

    openActionMenu(exp, "recurring");
  }

  function confirmRecurringEdit() {
    if (recurringActionTarget) {
      dash.ui.editingRecurring = recurringActionTarget;
      dash.ui.showRecurringModal = true;
      showRecurringEditModal = false;
      recurringActionTarget = null;
    }
  }

  // ─── Swipe to Delete State (Transactions) ─────────────────────────
  let showTxDeleteModal = $state(false);
  let showTxEditModal = $state(false);
  let txActionTarget = $state<any>(null);
  let txSwipingId = $state<string | null>(null);
  let txSwipeOffset = $state<number>(0);
  let txDisappearingId = $state<string | null>(null);
  let showActionMenuModal = $state(false);
  let activeActionItem = $state<any>(null);
  let activeActionType = $state<"transaction" | "recurring" | "folder">(
    "transaction",
  );

  function openActionMenu(
    item: any,
    type: "transaction" | "recurring" | "folder",
  ) {
    activeActionItem = item;
    activeActionType = type;
    showActionMenuModal = true;
  }

  function handleTxTouchStart(e: TouchEvent | MouseEvent, id: string) {
    if (dash.ui.activeTab !== "history" && dash.ui.activeTab !== "home") return;
    txSwipingId = id;
    const clientX =
      window.TouchEvent && e instanceof TouchEvent
        ? e.touches[0].clientX
        : (e as MouseEvent).clientX;
    (e.currentTarget as HTMLElement)?.setAttribute(
      "data-start-x",
      clientX.toString(),
    );
  }

  function handleTxTouchMove(e: TouchEvent | MouseEvent) {
    if (!txSwipingId) return;
    const startX = parseFloat(
      (e.currentTarget as HTMLElement)?.getAttribute("data-start-x") || "0",
    );
    const clientX =
      window.TouchEvent && e instanceof TouchEvent
        ? e.touches[0].clientX
        : (e as MouseEvent).clientX;
    const diff = clientX - startX;

    if (diff < 0) {
      txSwipeOffset = Math.max(diff, -150);
    } else {
      txSwipeOffset = 0;
    }
  }

  function handleTxTouchEnd(e: TouchEvent | MouseEvent, tx: any) {
    if (!txSwipingId) return;

    if (txSwipeOffset <= -80) {
      txActionTarget = tx;
      showTxDeleteModal = true;
    } else {
      txSwipingId = null;
      txSwipeOffset = 0;
    }
  }

  async function confirmTxDelete() {
    if (txActionTarget) {
      txDisappearingId = txActionTarget.id;
      showTxDeleteModal = false;
      setTimeout(async () => {
        await deleteTransaction(txActionTarget.id);
        txDisappearingId = null;
        txSwipingId = null;
        txSwipeOffset = 0;
        txActionTarget = null;
      }, 300);
    }
  }

  function cancelTxAction() {
    showTxDeleteModal = false;
    showTxEditModal = false;
    txSwipingId = null;
    txSwipeOffset = 0;
    txActionTarget = null;
  }

  function handleClickTxEdit(tx: any) {
    if (txSwipeOffset < -10) return;
    openActionMenu(tx, "transaction");
  }

  function confirmTxEdit() {
    if (txActionTarget) {
      dash.startEdit(txActionTarget);
      showTxEditModal = false;
      txActionTarget = null;
    }
  }

  import {
    categoriesState,
    addCategory,
    removeCategory,
    updateCategory,
  } from "$lib/stores/categories.svelte";
  import { moveCategory } from "$lib/stores/categories.svelte";
  let selectedFolder = $state<string | null>(null);

  // ─── Drag and Drop State ──────────────────────────────────────────
  let draggedIndex = $state<number | null>(null);

  // ─── Folder Deletion Confirmation State ──────────────────────────
  let showFolderDeleteConfirm = $state(false);
  let folderToMaybeDelete = $state<string | null>(null);
  let lastDragEndTime = $state(0);

  function requestDeleteFolder(name: string) {
    const expensesCount = dash.finance.recurringExpenses.filter(
      (e) =>
        e.category === name ||
        (name === "Otros" && (!e.category || e.category === "Otros")),
    ).length;

    if (expensesCount > 0) {
      folderToMaybeDelete = name;
      showFolderDeleteConfirm = true;
    } else {
      removeCategory(name);
    }
  }

  async function confirmDeleteFolder() {
    if (folderToMaybeDelete) {
      // 1. Delete associated expenses in the DB
      const expensesToDelete = dash.finance.recurringExpenses.filter(
        (e) =>
          e.category === folderToMaybeDelete ||
          (folderToMaybeDelete === "Otros" &&
            (!e.category || e.category === "Otros")),
      );

      for (const exp of expensesToDelete) {
        await deleteTransaction(exp.id); // This already reloads data
      }

      // 2. Remove the category folder
      removeCategory(folderToMaybeDelete);

      // 3. Close and cleanup
      showFolderDeleteConfirm = false;
      folderToMaybeDelete = null;
      await dash.loadData();
    }
  }

  function handleDragStart(e: DragEvent, index: number) {
    draggedIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      // Required for some browsers
      e.dataTransfer.setData("text/plain", index.toString());
    }
    // Add a class for visual feedback
    (e.target as HTMLElement).classList.add("dragging");
  }

  function handleDragOver(e: DragEvent) {
    if (e.preventDefault) e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    return false;
  }

  function handleDrop(e: DragEvent, targetIndex: number) {
    if (e.stopPropagation) e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      moveCategory(draggedIndex, targetIndex);
    }
    draggedIndex = null;
    return false;
  }

  function handleDragEnd(e: DragEvent) {
    (e.target as HTMLElement).classList.remove("dragging");
    draggedIndex = null;
    lastDragEndTime = Date.now();
  }

  let showNewFolderModal = $state(false);
  let newFolderName = $state("");
  let newFolderIcon = $state("📁");
  let showEmojiPicker = $state(false);
  let editingCategoryName = $state<string | null>(null);

  function openNewFolderModal(
    editName: string | null = null,
    editIcon: string = "📁",
  ) {
    editingCategoryName = editName;
    newFolderName = editName || "";
    newFolderIcon = editIcon;
    showNewFolderModal = true;
    showEmojiPicker = false;
  }

  function confirmNewFolder() {
    if (newFolderName.trim()) {
      if (editingCategoryName) {
        updateCategory(
          editingCategoryName,
          newFolderName,
          newFolderIcon || "📁",
        );
      } else {
        addCategory(newFolderName, newFolderIcon || "📁");
      }
      showNewFolderModal = false;
      editingCategoryName = null;
    }
  }

  // ── Modals ─────────────────────────────────────────────────────────────
  import TransactionModal from "$lib/components/modals/TransactionModal.svelte";
  import SavingsProjectionModal from "$lib/components/modals/SavingsProjectionModal.svelte";
  import RecurringExpenseModal from "$lib/components/modals/RecurringExpenseModal.svelte";
  import CategoryModal from "$lib/components/modals/CategoryModal.svelte";
  import ConfirmationModal from "$lib/components/modals/ConfirmationModal.svelte";
  import InfoModal from "$lib/components/modals/InfoModal.svelte";
</script>

<main class="dashboard {dash.ui.activeTab}">
  <!-- ─── Header ──────────────────────────────────────────────────────────── -->
  <TopNav {dash} />

  {#if dash.ui.activeTab === "home"}
    <!-- ─── VIEW: HOME ────────────────────────────────────────────────────── -->
    <HomeView
      {dash}
      {monthNames}
      {txDisappearingId}
      onEditTransaction={handleClickTxEdit}
      onDeleteTrigger={(tx) => {
        txActionTarget = tx;
        showTxDeleteModal = true;
      }}
      onActionMenu={openActionMenu}
    />
  {:else if dash.ui.activeTab === "history"}
    <!-- ─── VIEW: HISTORY ────────────────────────────────────────────────── -->
    <HistoryView
      {dash}
      {monthNames}
      {txDisappearingId}
      {visibleRecords}
      {handleScroll}
      onEditTransaction={handleClickTxEdit}
      onDeleteTrigger={(tx) => {
        txActionTarget = tx;
        showTxDeleteModal = true;
      }}
      onActionMenu={openActionMenu}
    />
  {:else if dash.ui.activeTab === "recurring"}
    <RecurringView
      {dash}
      {categoriesState}
      {selectedFolder}
      {disappearingId}
      {lastDragEndTime}
      {handleClickEdit}
      {openActionMenu}
      {openNewFolderModal}
      onDeleteTrigger={(exp) => {
        recurringActionTarget = exp;
        showRecurringDeleteModal = true;
      }}
      {handleDragStart}
      {handleDragOver}
      {handleDrop}
      {handleDragEnd}
      onFolderSelect={(folder) => (selectedFolder = folder)}
    />
  {:else if dash.ui.activeTab === "settings"}
    <SettingsView {dash} />
  {/if}

  {#if dash.finance.salaryUSD > 0 && dash.isCurrentPeriod()}
    <!-- ─── Expandable FAB ──────────────────────────────────────────────────── -->
    <div class="expandable-fab">
      <div
        class="fab-overlay"
        class:open={fabOpen}
        onclick={() => (fabOpen = false)}
        role="button"
        tabindex="0"
        onkeydown={(e) => {
          if (e.key === "Enter" || e.key === " ") fabOpen = false;
        }}
        aria-label="Cerrar menú flotante"
      ></div>
      <div class="fab-options" class:open={fabOpen}>
        <button
          class="fab-option"
          onclick={() => {
            dash.ui.showSavingsModal = true;
            fabOpen = false;
          }}
        >
          <span class="option-label">Proyección</span>
          <div class="option-btn bg-rocket">🚀</div>
        </button>
        <button
          class="fab-option"
          onclick={() => {
            dash.ui.showTransactionModal = true;
            fabOpen = false;
          }}
        >
          <span class="option-label">Movimiento</span>
          <div class="option-btn">
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
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
              ></path>
            </svg>
          </div>
        </button>
      </div>
      <button
        class="main-fab"
        class:open={fabOpen}
        onclick={() => (fabOpen = !fabOpen)}
        aria-label="Menú de opciones rápidas"
        aria-expanded={fabOpen}
      >
        <svg
          class="plus-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  {/if}

  <BottomNav />

  <!-- ─── Specialized Modals ────────────────────────────────────────────── -->
  <TransactionModal {dash} />
  <SavingsProjectionModal {dash} />
  <RecurringExpenseModal {dash} {selectedFolder} />
  <InfoModal {dash} />

  <CategoryModal
    isOpen={showNewFolderModal}
    close={() => {
      showNewFolderModal = false;
      editingCategoryName = null;
    }}
    bind:newFolderName
    bind:newFolderIcon
    {editingCategoryName}
    onConfirm={confirmNewFolder}
  />

  <ActionMenu
    isOpen={showActionMenuModal}
    close={() => (showActionMenuModal = false)}
    type={activeActionType}
    item={activeActionItem}
    onEdit={(item, type) => {
      if (type === "transaction") {
        dash.startEdit(item);
      } else if (type === "folder") {
        openNewFolderModal(item.name, item.icon);
      } else {
        dash.ui.editingRecurring = item;
        dash.ui.showRecurringModal = true;
      }
    }}
    onDelete={(item, type) => {
      if (type === "transaction") {
        txActionTarget = item;
        showTxDeleteModal = true;
      } else if (type === "folder") {
        requestDeleteFolder(item.name);
      } else {
        recurringActionTarget = item;
        showRecurringDeleteModal = true;
      }
    }}
  />

  <!-- Confirmation Modals -->
  <ConfirmationModal
    isOpen={showTxDeleteModal}
    close={cancelTxAction}
    title="¿Eliminar Movimiento?"
    message="Estás a punto de eliminar"
    targetDescription={txActionTarget?.description}
    onConfirm={confirmTxDelete}
  />

  <ConfirmationModal
    isOpen={showRecurringDeleteModal}
    close={cancelRecurringAction}
    title="¿Eliminar Gasto?"
    message="Estás a punto de eliminar"
    targetDescription={recurringActionTarget?.description}
    onConfirm={confirmRecurringDelete}
  />

  <ConfirmationModal
    isOpen={showRecurringEditModal}
    close={cancelRecurringAction}
    title="¿Editar Gasto?"
    message="Se abrirá el panel para modificar"
    targetDescription={recurringActionTarget?.description}
    onConfirm={confirmRecurringEdit}
    danger={false}
    confirmLabel="Continuar"
  />

  <ConfirmationModal
    isOpen={showFolderDeleteConfirm}
    close={() => (showFolderDeleteConfirm = false)}
    title="¿Borrar Carpeta?"
    message="Esta carpeta tiene gastos registrados. Si la borras, se eliminarán permanentemente todos los gastos fijos asociados a"
    targetDescription={folderToMaybeDelete}
    onConfirm={confirmDeleteFolder}
    confirmLabel="Borrar Todo"
  />
</main>

<style>
  /* Styles moved to components and global CSS */
</style>
