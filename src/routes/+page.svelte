<script lang="ts">
  import { DashboardState } from "$lib/logic/DashboardState.svelte";
  import {
    deleteTransaction,
    migrateCurrency,
    clearAllData,
  } from "$lib/stores/finance.svelte";

  // ── Components ────────────────────────────────────────────────────────────
  import Modal from "$lib/components/Modal.svelte";
  import TransactionForm from "$lib/components/TransactionForm.svelte";
  import SalaryConfig from "$lib/components/SalaryConfig.svelte";
  import CurrencyToggle from "$lib/components/CurrencyToggle.svelte";
  import CurrencyRates from "$lib/components/CurrencyRates.svelte";
  import RecurringExpenses from "$lib/components/RecurringExpenses.svelte";
  import SavingsSimulator from "$lib/components/SavingsSimulator.svelte";
  import FinancialInsights from "$lib/components/FinancialInsights.svelte";
  import SalaryHistoryLog from "$lib/components/SalaryHistoryLog.svelte";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import Tutorial from "$lib/components/Tutorial.svelte";
  import BottomNav from "$lib/components/BottomNav.svelte";
  import PeriodSelector from "$lib/components/PeriodSelector.svelte";
  import { fade } from "svelte/transition";

  const dash = new DashboardState();
  let fabOpen = $state(false);

  // Pagination state
  let pageSize = 15;
  let visibleRecords = $state(pageSize);
  let isDeleteModalOpen = $state(false);
  let transactionToDelete = $state<string | null>(null);

  // Currency change confirmation
  let showCurrencyConfirmModal = $state(false);
  let pendingCurrency = $state<string | null>(null);
  let showClearAllConfirmModal = $state(false);

  function handleCurrencySelection(opt: string) {
    if (dash.finance.localCurrency === opt) return;
    pendingCurrency = opt;
    showCurrencyConfirmModal = true;
  }

  async function confirmCurrencyChange() {
    if (pendingCurrency) {
      const oldCurrency = dash.finance.localCurrency;
      await migrateCurrency(oldCurrency, pendingCurrency);
      showCurrencyConfirmModal = false;
      pendingCurrency = null;
    }
  }

  async function confirmClearAll() {
    await clearAllData();
    showClearAllConfirmModal = false;
    dash.ui.activeTab = "home"; // Take user home after reset
  }

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

  function confirmDelete(id: string) {
    transactionToDelete = id;
    isDeleteModalOpen = true;
  }

  async function handleDelete() {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete);
      isDeleteModalOpen = false;
      transactionToDelete = null;
    }
  }

  // Reload data when period changes to ensure correct historical salary
  $effect(() => {
    dash.finance.selectedMonth;
    dash.finance.selectedYear;
    dash.loadData();
  });

  // When the user switches to the Config tab, reload the salary using TODAY's date
  // so the Config always shows the real-world current salary, never a historical one.
  let salaryReloadFn: (() => void) | null = null;
  $effect(() => {
    if (dash.ui.activeTab === "config" && salaryReloadFn) {
      salaryReloadFn();
    }
  });

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

    recurringActionTarget = exp;
    showRecurringEditModal = true;
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
  let activeActionType = $state<"transaction" | "recurring">("transaction");

  function openActionMenu(item: any, type: "transaction" | "recurring") {
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
    txActionTarget = tx;
    showTxEditModal = true;
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
  } from "$lib/stores/categories.svelte";
  import { moveCategory } from "$lib/stores/categories.svelte";
  let selectedFolder = $state<string | null>(null);

  // ─── Drag and Drop State ──────────────────────────────────────────
  let draggedIndex = $state<number | null>(null);

  // ─── Folder Deletion Confirmation State ──────────────────────────
  let showFolderDeleteConfirm = $state(false);
  let folderToMaybeDelete = $state<string | null>(null);

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
  }

  let showNewFolderModal = $state(false);
  let newFolderName = $state("");
  let newFolderIcon = $state("📁");
  let showEmojiPicker = $state(false);

  const commonEmojis = [
    // Finanzas (Muchos más)
    "💸",
    "💰",
    "💵",
    "💳",
    "🪙",
    "🏦",
    "📈",
    "📉",
    "🏷️",
    "🪙",
    "💹",
    "💴",
    "💶",
    "💷",
    "🤑",
    "💎",
    "⚖️",
    "🗝️",
    "🔋",
    "🏮",
    // Caritas y Expresiones
    "😊",
    "🥰",
    "😎",
    "🤩",
    "🤔",
    "🧐",
    "🥳",
    "😀",
    "😇",
    "😋",
    "😜",
    "🤭",
    "😌",
    "😴",
    "🌞",
    "✨",
    "🔥",
    "🌈",
    "⭐",
    "🍀",
    // Corazones
    "❤️",
    "💖",
    "💙",
    "💚",
    "💛",
    "🧡",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💘",
    "💝",
    "❣️",
    "💟",
    // Animales (Más variedad)
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🐧",
    "🐦",
    "🐤",
    "🦆",
    "🦅",
    "🦉",
    "🦋",
    "🐌",
    "🐞",
    "🐜",
    "🦟",
    "🐝",
    "🐢",
    "🐍",
    "🦖",
    "🐙",
    "🦑",
    "🦐",
    "🐡",
    "🐠",
    "🐬",
    "🐳",
    "🦈",
    "🐘",
    "🦏",
    "🦒",
    "🐃",
    "🐄",
    "🐎",
    "🐏",
    "🐐",
    "🐫",
    "🐪",
    "🦘",
    "🦥",
    "🦦",
    "🦨",
    "🦡",
    "🐾",
    // Carpetas y Documentos
    "📁",
    "📂",
    "💼",
    "📝",
    "📊",
    "📋",
    "📁",
    "📂",
    "🗂️",
    "🗳️",
    // Comida y Bebida
    "🥗",
    "🍎",
    "🍗",
    "🍕",
    "🍔",
    "🍦",
    "🍰",
    "☕",
    "🍷",
    "🍺",
    "🍹",
    "🛒",
    "🥑",
    "🥦",
    "🍣",
    "🌮",
    "🥘",
    "🍩",
    "🍪",
    "🍫",
    // Vivienda y Hogar
    "🏠",
    "🏢",
    "🏘️",
    "🛋️",
    "🛌",
    "🚿",
    "🛁",
    "🔑",
    "💡",
    "🛠️",
    "🧶",
    "🧹",
    "🧺",
    "🏠",
    // Transporte y Viajes
    "🚌",
    "🚗",
    "🚕",
    "🚚",
    "🚲",
    "🚀",
    "✈️",
    "🚢",
    "🗺️",
    "⛱️",
    "🏖️",
    "🏨",
    "🚉",
    "🚧",
    // Salud y Bienestar
    "🏥",
    "💊",
    "🩹",
    "🩺",
    "🏃",
    "🧘",
    "🚲",
    "🍎",
    "🧴",
    "🧼",
    "🦷",
    // Entretenimiento y Hobbies
    "🎮",
    "🎬",
    "🍿",
    "🎭",
    "🎨",
    "🎤",
    "🎧",
    "⚽",
    "🏀",
    "🎸",
    "🎹",
    "🧩",
    "🎳",
    "🎲",
    "🎯",
    // Educación y Trabajo
    "🎓",
    "📚",
    "🖊️",
    "💻",
    "📱",
    "🖱️",
    "🖨️",
    "🔬",
    "🔭",
    "📅",
    "📐",
    "📎",
  ];

  function openNewFolderModal() {
    newFolderName = "";
    newFolderIcon = "📁";
    showNewFolderModal = true;
    showEmojiPicker = false;
  }

  function confirmNewFolder() {
    if (newFolderName.trim()) {
      addCategory(newFolderName, newFolderIcon || "📁");
      showNewFolderModal = false;
    }
  }
</script>

<main class="dashboard {dash.ui.activeTab}">
  <!-- ─── Header ──────────────────────────────────────────────────────────── -->
  <header class="top-nav">
    <div class="brand">
      <h1 class="gradient-text">Lumina</h1>
      <ThemeToggle />
      <button
        class="theme-toggle time-toggle"
        class:active={dash.finance.isTimeMode}
        onclick={() => (dash.finance.isTimeMode = !dash.finance.isTimeMode)}
        title="Modo Tiempo-Vida (Time = Money)"
      >
        <span class="icon">{dash.finance.isTimeMode ? "⏳" : "⌛"}</span>
      </button>
    </div>
    <div class="actions">
      <PeriodSelector />
    </div>
  </header>

  {#if dash.ui.activeTab === "home"}
    <!-- ─── VIEW: HOME ────────────────────────────────────────────────────── -->
    <div class="home-scroll-container">
      {#if !dash.isCurrentPeriod()}
        <div class="historical-indicator glass-card" transition:fade>
          <div class="indicator-content">
            <span class="indicator-icon">📅</span>
            <div class="indicator-text">
              <span class="label">Viendo Historial</span>
              <span class="period">{dash.currentPeriodLabel()}</span>
            </div>
          </div>
          <button
            class="return-btn"
            onclick={() => {
              const now = new Date();
              dash.finance.selectedMonth = now.getMonth();
              dash.finance.selectedYear = now.getFullYear();
            }}
          >
            Volver al Presente
          </button>
        </div>
      {/if}
      <!-- ─── Liquidity Radar ──────────────────────────────────────────────────── -->
      <section class="main-radar">
        <div class="view-selector glass-card">
          <button
            class:active={dash.finance.viewMode === "quincena"}
            onclick={() => (dash.finance.viewMode = "quincena")}
            >Quincena</button
          >
          <button
            class:active={dash.finance.viewMode === "mes"}
            onclick={() => (dash.finance.viewMode = "mes")}>Mes</button
          >
        </div>
        <div class="radar-visual">
          <svg viewBox="0 0 100 100">
            <circle class="bg-circle" cx="50" cy="50" r="45" />
            <circle
              class="fg-circle"
              cx="50"
              cy="50"
              r="45"
              style="stroke-dasharray: {dash.displayRadarValue() * 2.82} 282"
            />
            <text class="radar-text" x="50" y="52"
              >{dash.displayRadarValue()}%</text
            >
            <text class="radar-label-small" x="50" y="62">LIQUIDEZ</text>
          </svg>
        </div>
        <div class="radar-info">
          <span class="label">
            {dash.isCurrentPeriod()
              ? dash.isMonthly()
                ? "Disponible del Mes"
                : "Disponible Quincenal"
              : "Balance de Cierre"}
          </span>
          <span class="value" class:negative={dash.displayBudgetRemaining() < 0}
            >{dash.formatCurrency(dash.displayBudgetRemaining())}</span
          >
        </div>
      </section>

      <!-- ─── Summary Cards ──────────────────────────────────────────────────── -->
      <section class="summary-cards">
        <div class="card glass-card">
          <span class="card-label">Ingreso Neto</span>
          <span class="card-value">
            {dash.formatCurrency(dash.displayNetIncome())}
          </span>
          <span class="card-hint">
            {dash.isCurrentPeriod() ? "Total" : "Cierre"}
            {dash.isMonthly() ? "30 días" : "15 días"}
          </span>
        </div>
        <div class="card glass-card">
          <span class="card-label">Ingresos Extra</span>
          <span class="card-value positive">
            {dash.formatCurrency(dash.displayExtraIncome())}
          </span>
          <span class="card-hint">
            {dash.isCurrentPeriod() ? "Total" : "Cierre"}
            {dash.isMonthly() ? "Mes" : "Quincena"}
          </span>
        </div>
        <div class="card glass-card">
          <span class="card-label">Gastos Fijos</span>
          <span class="card-value negative">
            {dash.formatCurrency(dash.displayRecurring())}
          </span>
          <span class="card-hint">
            {dash.isCurrentPeriod() ? "Proyección" : "Total"}
            {dash.isMonthly() ? "Mes" : "Quincena"}
          </span>
        </div>
        <div class="card glass-card">
          <span class="card-label">Gastos Variables</span>
          <span class="card-value negative">
            {dash.formatCurrency(dash.displayVariableExpenses())}
          </span>
          <span class="card-hint">
            {dash.isCurrentPeriod() ? "Total" : "Cierre"}
            {dash.isMonthly() ? "Mes" : "Quincena"}
          </span>
        </div>
      </section>

      <!-- ─── Financial Insights ─────────────────────────────────────────────── -->
      <section class="insights-section">
        <FinancialInsights
          netIncome={dash.displayNetIncome()}
          variableExpenses={dash.displayVariableExpenses()}
          recurringExpenses={dash.finance.recurringExpenses}
          viewMode={dash.finance.viewMode}
        />
      </section>

      <!-- ─── Transaction Timeline (Preview) ─────────────────────────────────── -->
      <section class="timeline">
        <div class="timeline-header">
          <div class="spacer"></div>
          <h2>Últimos Movimientos</h2>
          <div class="header-actions">
            <button
              class="link-btn"
              onclick={() => (dash.ui.activeTab = "history")}>Ver todo</button
            >
          </div>
        </div>
        <div class="tx-scroll">
          {#each dash.currentPeriodTransactions().slice(0, 2) as tx, i}
            <div
              class="tx-item glass-card {String(tx.id).startsWith(
                'virtual-salary',
              )
                ? ''
                : 'swipeable'}"
              class:disappearing={txDisappearingId === tx.id}
              style={txSwipingId === tx.id
                ? `transform: translateX(${txSwipeOffset}px)`
                : ""}
              ontouchstart={(e) =>
                String(tx.id).startsWith("virtual-salary")
                  ? null
                  : handleTxTouchStart(e, tx.id)}
              ontouchmove={String(tx.id).startsWith("virtual-salary")
                ? null
                : handleTxTouchMove}
              ontouchend={(e) =>
                String(tx.id).startsWith("virtual-salary")
                  ? null
                  : handleTxTouchEnd(e, tx)}
              onmousedown={(e) =>
                String(tx.id).startsWith("virtual-salary")
                  ? null
                  : handleTxTouchStart(e, tx.id)}
              onmousemove={String(tx.id).startsWith("virtual-salary")
                ? null
                : handleTxTouchMove}
              onmouseup={(e) =>
                String(tx.id).startsWith("virtual-salary")
                  ? null
                  : handleTxTouchEnd(e, tx)}
              onmouseleave={(e) =>
                String(tx.id).startsWith("virtual-salary")
                  ? null
                  : handleTxTouchEnd(e, tx)}
              onclick={() =>
                String(tx.id).startsWith("virtual-salary")
                  ? null
                  : handleClickTxEdit(tx)}
              role="button"
              tabindex="0"
              onkeypress={(e) =>
                e.key === "Enter" &&
                !String(tx.id).startsWith("virtual-salary") &&
                handleClickTxEdit(tx)}
            >
              <div class="tx-left">
                <span class="tx-desc">{tx.description}</span>
                <span class="tx-meta">{tx.category} • {tx.date}</span>
              </div>
              <div class="tx-right-actions">
                <span
                  class="tx-amount {tx.amount > 0 ? 'positive' : 'negative'}"
                >
                  {tx.amount > 0 ? "+" : ""}{dash.formatLocalAmount(tx.amount)}
                </span>
                {#if !String(tx.id).startsWith("virtual-salary")}
                  <button
                    class="more-btn"
                    onclick={(e) => {
                      e.stopPropagation();
                      openActionMenu(tx, "transaction");
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
              {#if !String(tx.id).startsWith("virtual-salary")}
                <div class="delete-backdrop"></div>
              {/if}
            </div>
          {/each}
          {#if dash.currentPeriodTransactions().length === 0}
            <p class="empty">
              No hay movimientos en {monthNames[dash.finance.selectedMonth]} de {dash
                .finance.selectedYear}.
            </p>
          {/if}
        </div>
      </section>
    </div>
  {:else if dash.ui.activeTab === "history"}
    <!-- ─── VIEW: HISTORY ────────────────────────────────────────────────── -->
    <section class="full-history">
      <div class="history-header">
        <h2>Historial de Movimientos</h2>
      </div>
      <div class="history-container glass-card">
        <div class="history-list" onscroll={handleScroll}>
          {#each dash
            .currentPeriodTransactions()
            .slice(0, visibleRecords) as tx, index}
            <div
              class="tx-item {String(tx.id).startsWith('virtual-salary')
                ? ''
                : 'swipeable'}"
              class:disappearing={txDisappearingId === tx.id}
              style={txSwipingId === tx.id
                ? `transform: translateX(${txSwipeOffset}px)`
                : ""}
              ontouchstart={(e) =>
                String(tx.id).startsWith("virtual-salary")
                  ? null
                  : handleTxTouchStart(e, tx.id)}
              ontouchmove={String(tx.id).startsWith("virtual-salary")
                ? null
                : handleTxTouchMove}
              ontouchend={(e) =>
                String(tx.id).startsWith("virtual-salary")
                  ? null
                  : handleTxTouchEnd(e, tx)}
              onmousedown={(e) =>
                String(tx.id).startsWith("virtual-salary")
                  ? null
                  : handleTxTouchStart(e, tx.id)}
              onmousemove={String(tx.id).startsWith("virtual-salary")
                ? null
                : handleTxTouchMove}
              onmouseup={(e) =>
                String(tx.id).startsWith("virtual-salary")
                  ? null
                  : handleTxTouchEnd(e, tx)}
              onmouseleave={(e) =>
                String(tx.id).startsWith("virtual-salary")
                  ? null
                  : handleTxTouchEnd(e, tx)}
              onclick={() =>
                String(tx.id).startsWith("virtual-salary")
                  ? null
                  : handleClickTxEdit(tx)}
              role="button"
              tabindex="0"
              onkeypress={(e) =>
                e.key === "Enter" &&
                !String(tx.id).startsWith("virtual-salary") &&
                handleClickTxEdit(tx)}
            >
              <div class="tx-left">
                <span class="tx-desc"
                  >{tx.description || "Sin descripción"}</span
                >
                <span class="tx-meta">{tx.category} • {tx.date}</span>
              </div>
              <div class="tx-right-actions">
                <span
                  class="tx-amount {tx.amount > 0 ? 'positive' : 'negative'}"
                >
                  {tx.amount > 0 ? "+" : ""}{dash.formatLocalAmount(tx.amount)}
                </span>
                {#if !String(tx.id).startsWith("virtual-salary")}
                  <button
                    class="more-btn"
                    onclick={(e) => {
                      e.stopPropagation();
                      openActionMenu(tx, "transaction");
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
              {#if !String(tx.id).startsWith("virtual-salary")}
                <div class="delete-backdrop"></div>
              {/if}
            </div>
          {/each}
          {#if dash.currentPeriodTransactions().length === 0}
            <p class="empty">
              No hay movimientos en {monthNames[dash.finance.selectedMonth]} de {dash
                .finance.selectedYear}.
            </p>
          {/if}
        </div>
      </div>
    </section>
  {:else if dash.ui.activeTab === "recurring"}
    <!-- ─── VIEW: RECURRING FIXED EXPENSES ─────────────────────────────── -->
    <section class="full-history">
      <div class="history-header">
        {#if selectedFolder === null}
          <h2>Carpetas</h2>
          <button class="add-btn-small" onclick={openNewFolderModal}>
            + Nueva
          </button>
        {:else}
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button
              class="icon-btn"
              onclick={() => (selectedFolder = null)}
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
          <button
            class="add-btn-small"
            onclick={() => (dash.ui.showRecurringModal = true)}
          >
            + Agregar
          </button>
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
                onclick={() => (selectedFolder = cat.name)}
              >
                <div class="folder-icon">{cat.icon}</div>
                <div class="folder-name">{cat.name}</div>
                <div class="folder-count">
                  {dash.finance.recurringExpenses.filter(
                    (e) =>
                      e.category === cat.name ||
                      (cat.name === "Otros" &&
                        (!e.category || e.category === "Otros")),
                  ).length} gastos
                </div>
              </button>
              <button
                class="delete-folder-btn"
                onclick={(e) => {
                  e.stopPropagation();
                  requestDeleteFolder(cat.name);
                }}
                title="Eliminar carpeta">×</button
              >
            </div>
          {/each}
          <!-- Spacer to ensure last row is visible above bottom nav -->
          <div style="grid-column: span 2; height: 1px;"></div>
        </div>
      {:else}
        <div class="history-container glass-card" style="overflow: hidden;">
          <div class="history-list">
            {#each dash.finance.recurringExpenses.filter((e) => e.category === selectedFolder || (selectedFolder === "Otros" && (!e.category || e.category === "Otros"))) as exp}
              <div
                class="tx-item swipeable"
                class:disappearing={disappearingId === exp.id}
                style={swipingId === exp.id
                  ? `transform: translateX(${swipeOffset}px)`
                  : ""}
                ontouchstart={(e) => handleTouchStart(e, exp.id)}
                ontouchmove={handleTouchMove}
                ontouchend={(e) => handleTouchEnd(e, exp)}
                onmousedown={(e) => handleTouchStart(e, exp.id)}
                onmousemove={handleTouchMove}
                onmouseup={(e) => handleTouchEnd(e, exp)}
                onmouseleave={(e) => handleTouchEnd(e, exp)}
                onclick={() => handleClickEdit(exp)}
                role="button"
                tabindex="0"
                onkeypress={(e) => e.key === "Enter" && handleClickEdit(exp)}
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
                <div class="delete-backdrop"></div>
              </div>
            {/each}
            {#if dash.finance.recurringExpenses.filter((e) => e.category === selectedFolder || (selectedFolder === "Otros" && (!e.category || e.category === "Otros"))).length === 0}
              <p class="empty">
                No hay gastos fijos registrados en esta categoría.
              </p>
            {/if}
          </div>
        </div>
      {/if}
    </section>
  {:else if dash.ui.activeTab === "settings"}
    <!-- ─── VIEW: SETTINGS ───────────────────────────────────────────────── -->
    <section class="full-settings">
      <div class="settings-content">
        <CurrencyRates currencies={dash.finance.currencies} />

        <div class="local-currency-box glass-card">
          <span class="label">
            Divisa Local 🌍
            <button
              type="button"
              class="info-icon"
              onclick={() => {
                dash.ui.infoModalTitle = "Divisa Local";
                dash.ui.infoModalText =
                  "La divisa local es la moneda principal que usa Lumina para tus cálculos. 🔄 Si la cambias, tus movimientos, gastos fijos y salario se convertirán automáticamente al tipo de cambio actual.";
                dash.ui.showInfoModal = true;
              }}
              aria-label="Más información sobre Divisa Local"
              ><svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                ><circle cx="12" cy="12" r="10" stroke-width="1.5" /><path
                  d="M12 17v-5"
                  stroke-width="1.8"
                  stroke-linecap="round"
                /><circle
                  cx="12"
                  cy="7.5"
                  r="1"
                  fill="currentColor"
                  stroke="none"
                /></svg
              ></button
            >
          </span>
          <div class="currency-options">
            {#each ["COP", "CLP", "USD"] as opt}
              <button
                class="currency-opt-btn {dash.finance.localCurrency === opt
                  ? 'active'
                  : ''}"
                onclick={() => handleCurrencySelection(opt)}>{opt}</button
              >
            {/each}
          </div>
        </div>

        <SalaryConfig
          currency={dash.finance.localCurrency}
          currencies={dash.finance.currencies}
          onSalaryUpdated={dash.loadData}
          onActivate={(fn) => {
            salaryReloadFn = fn;
          }}
        />

        <div
          class="local-currency-box glass-card"
          style="margin-top: 15px; border-color: rgba(255, 60, 60, 0.2);"
        >
          <span class="label" style="color: #ff4d4d;">
            Zona de Peligro ⚠️
            <button
              type="button"
              class="info-icon"
              onclick={() => {
                dash.ui.infoModalTitle = "Limpiar Todo";
                dash.ui.infoModalText =
                  "Esta acción eliminará permanentemente todos tus movimientos, gastos fijos y la configuración de tu salario. La aplicación quedará como nueva.";
                dash.ui.showInfoModal = true;
              }}
              aria-label="Más información sobre Limpiar Todo"
              ><svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                ><circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#ff4d4d"
                  stroke-width="1.5"
                /><path
                  d="M12 17v-5"
                  stroke="#ff4d4d"
                  stroke-width="1.8"
                  stroke-linecap="round"
                /><circle
                  cx="12"
                  cy="7.5"
                  r="1"
                  fill="#ff4d4d"
                  stroke="none"
                /></svg
              ></button
            >
          </span>
          <div style="margin-top: 10px;">
            <button
              class="add-btn"
              style="background: rgba(255, 60, 60, 0.2); color: #ff4d4d; border: 1px solid rgba(255, 60, 60, 0.3);"
              onclick={() => (showClearAllConfirmModal = true)}
              >Limpiar Todos los Datos</button
            >
          </div>
        </div>
      </div>
    </section>
  {/if}

  {#if dash.finance.salaryUSD > 0}
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

  <!-- ─── Shared Modals (still needed for floating actions) ──────────────── -->
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

  <Modal
    isOpen={dash.ui.showSavingsModal}
    close={() => (dash.ui.showSavingsModal = false)}
    title="Proyección de Ahorro"
    minimal={true}
  >
    <div style="padding-bottom: 0.5rem;">
      <div style="text-align:center; margin-bottom: 1rem;">
        <div style="font-size: 2rem;">🚀</div>
        <h3 style="margin: 4px 0 0; color: var(--text-color);">
          Proyección de Ahorro
        </h3>
      </div>
      <SavingsSimulator availableBalance={dash.displayBudgetRemaining()} />
    </div>
  </Modal>

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

  <!-- Confirm Delete Recurring Modal -->
  <Modal
    isOpen={showRecurringDeleteModal}
    close={cancelRecurringAction}
    title="Eliminar Gasto Fijo"
    minimal={true}
  >
    <div style="text-align: center;">
      <div style="font-size: 2.5rem; margin-bottom: 10px;">🗑️</div>
      <h3 style="margin: 0 0 10px;">¿Eliminar Gasto?</h3>
      <p style="margin-bottom: 25px; color: var(--text-dim);">
        Estás a punto de eliminar <strong
          >{recurringActionTarget?.description}</strong
        >.<br />Esta acción no se puede deshacer.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button
          class="add-btn"
          style="background: var(--surface-light); color: var(--text-color); flex: 1;"
          onclick={cancelRecurringAction}>Cancelar</button
        >
        <button
          class="add-btn"
          style="background: rgba(255, 60, 60, 0.2); color: #ff4d4d; flex: 1;"
          onclick={confirmRecurringDelete}>Eliminar</button
        >
      </div>
    </div>
  </Modal>

  <!-- Confirm Edit Recurring Modal -->
  <Modal
    isOpen={showRecurringEditModal}
    close={cancelRecurringAction}
    title="Editar Gasto Fijo"
    minimal={true}
  >
    <div style="text-align: center;">
      <div style="font-size: 2.5rem; margin-bottom: 10px;">✏️</div>
      <h3 style="margin: 0 0 10px;">¿Editar Gasto?</h3>
      <p style="margin-bottom: 25px; color: var(--text-dim);">
        Se abrirá el panel para modificar<br /><strong
          >{recurringActionTarget?.description}</strong
        >.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button
          class="add-btn"
          style="background: var(--surface-light); color: var(--text-color); flex: 1;"
          onclick={cancelRecurringAction}>Cancelar</button
        >
        <button class="add-btn" style="flex: 1;" onclick={confirmRecurringEdit}
          >Continuar</button
        >
      </div>
    </div>
  </Modal>

  <!-- ─── Tutorial ────────────────────────────────────────────────────────── -->
  {#if dash.ui.showTutorial}
    <Tutorial
      step={dash.ui.tutorialStep}
      onNext={() => dash.ui.tutorialStep++}
      onComplete={dash.completeTutorial}
    />
  {/if}
  <!-- Confirm Delete Transaction Modal -->
  <Modal
    isOpen={showTxDeleteModal}
    close={cancelTxAction}
    title="Eliminar Movimiento"
    minimal={true}
  >
    <div style="text-align: center;">
      <div style="font-size: 2.5rem; margin-bottom: 10px;">🗑️</div>
      <h3 style="margin: 0 0 10px;">¿Eliminar Movimiento?</h3>
      <p style="margin-bottom: 25px; color: var(--text-dim);">
        Estás a punto de eliminar <strong>{txActionTarget?.description}</strong
        >.<br />Esto recalculará tu historial y balances.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button
          class="add-btn"
          style="background: var(--surface-light); color: var(--text-color); flex: 1;"
          onclick={cancelTxAction}>Cancelar</button
        >
        <button
          class="add-btn"
          style="background: rgba(255, 60, 60, 0.2); color: #ff4d4d; flex: 1;"
          onclick={confirmTxDelete}>Eliminar</button
        >
      </div>
    </div>
  </Modal>

  <!-- Confirm Currency Change Modal -->
  <Modal
    isOpen={showCurrencyConfirmModal}
    close={() => (showCurrencyConfirmModal = false)}
    title="¿Confirmar Cambio de Divisa?"
    minimal={true}
  >
    <div style="text-align: center;">
      <div style="font-size: 2.5rem; margin-bottom: 10px;">🔄</div>
      <h3 style="margin: 0 0 10px;">¿Convertir a {pendingCurrency}?</h3>
      <p style="margin-bottom: 25px; color: var(--text-dim);">
        Al cambiar la divisa local, <strong
          >convertiremos automáticamente</strong
        >
        todos tus movimientos, gastos fijos y salario al tipo de cambio actual.<br
        /><br />
        Tus datos permanecerán intactos, pero expresados en {pendingCurrency}.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button
          class="add-btn"
          style="background: var(--surface-light); color: var(--text-color); flex: 1;"
          onclick={() => (showCurrencyConfirmModal = false)}>Cancelar</button
        >
        <button class="add-btn" style="flex: 1;" onclick={confirmCurrencyChange}
          >Confirmar y Convertir</button
        >
      </div>
    </div>
  </Modal>

  <!-- Confirm Edit Transaction Modal -->
  <Modal
    isOpen={showTxEditModal}
    close={cancelTxAction}
    title="Editar Movimiento"
    minimal={true}
  >
    <div style="text-align: center;">
      <div style="font-size: 2.5rem; margin-bottom: 10px;">✏️</div>
      <h3 style="margin: 0 0 10px;">¿Editar Movimiento?</h3>
      <p style="margin-bottom: 25px; color: var(--text-dim);">
        Se abrirá el panel para modificar<br /><strong
          >{txActionTarget?.description}</strong
        >.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button
          class="add-btn"
          style="background: var(--surface-light); color: var(--text-color); flex: 1;"
          onclick={cancelTxAction}>Cancelar</button
        >
        <button class="add-btn" style="flex: 1;" onclick={confirmTxEdit}
          >Continuar</button
        >
      </div>
    </div>
  </Modal>

  <!-- Confirm Clear All Data Modal -->
  <Modal
    isOpen={showClearAllConfirmModal}
    close={() => (showClearAllConfirmModal = false)}
    title="¿Limpiar Todo el Sistema?"
    minimal={true}
  >
    <div style="text-align: center;">
      <div style="font-size: 2.5rem; margin-bottom: 10px;">💣</div>
      <h3 style="margin: 0 0 10px; color: #ff4d4d;">¡Atención!</h3>
      <p style="margin-bottom: 25px; color: var(--text-dim);">
        Estás a punto de <strong>borrar absolutamente todo</strong>.<br /><br />
        Esta acción no se puede deshacer. ¿Deseas continuar?
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button
          class="add-btn"
          style="background: var(--surface-light); color: var(--text-color); flex: 1;"
          onclick={() => (showClearAllConfirmModal = false)}>Cancelar</button
        >
        <button
          class="add-btn"
          style="background: #ff4d4d; color: white; flex: 1;"
          onclick={confirmClearAll}>Borrar Todo</button
        >
      </div>
    </div>
  </Modal>
  <!-- Action Menu Modal -->
  <Modal
    isOpen={showActionMenuModal}
    close={() => (showActionMenuModal = false)}
    title="Opciones"
    minimal={true}
  >
    <div class="action-menu">
      <div class="action-menu-header">
        <div class="item-info">
          <span class="item-desc"
            >{activeActionItem?.description || "Sin descripción"}</span
          >
          <span class="item-meta"
            >{activeActionItem?.category || activeActionItem?.frequency || ""} •
            {activeActionItem?.date ||
              (activeActionItem?.day_of_month
                ? "Día " + activeActionItem.day_of_month
                : "")}</span
          >
        </div>
      </div>
      <button
        class="action-item"
        onclick={() => {
          showActionMenuModal = false;
          if (activeActionType === "transaction") {
            dash.startEdit(activeActionItem);
          } else {
            dash.ui.editingRecurring = activeActionItem;
            dash.ui.showRecurringModal = true;
          }
        }}
      >
        <span class="icon">✏️</span>
        <span class="label">Editar</span>
      </button>
      <button
        class="action-item danger"
        onclick={() => {
          showActionMenuModal = false;
          if (activeActionType === "transaction") {
            txActionTarget = activeActionItem;
            showTxDeleteModal = true;
          } else {
            recurringActionTarget = activeActionItem;
            showRecurringDeleteModal = true;
          }
        }}
      >
        <span class="icon">🗑️</span>
        <span class="label">Eliminar</span>
      </button>
      <button
        class="action-item cancel"
        onclick={() => (showActionMenuModal = false)}
      >
        Cancelar
      </button>
    </div>
  </Modal>

  <!-- Generic Info Modal (same style as Proyección) -->
  <Modal
    isOpen={dash.ui.showInfoModal}
    close={() => (dash.ui.showInfoModal = false)}
    title=""
    minimal={true}
  >
    <div style="padding-bottom: 0.5rem;">
      <div style="text-align:center; margin-bottom: 1rem;">
        <div style="font-size: 2rem;">ℹ️</div>
        <h3 style="margin: 6px 0 0; color: var(--text-color);">
          {dash.ui.infoModalTitle}
        </h3>
      </div>
      <p
        style="color: var(--text-dim); line-height: 1.6; text-align: center; margin: 0 0 1.2rem;"
      >
        {dash.ui.infoModalText}
      </p>
      <div style="display: flex; justify-content: center;">
        <button
          class="add-btn"
          style="max-width: 180px;"
          onclick={() => (dash.ui.showInfoModal = false)}
        >
          Entendido
        </button>
      </div>
    </div>
  </Modal>

  <!-- New Folder Modal -->
  <Modal
    isOpen={showFolderDeleteConfirm}
    close={() => (showFolderDeleteConfirm = false)}
    title="¿Borrar Carpeta?"
    minimal={true}
  >
    <div class="delete-confirmation">
      <div style="font-size: 3rem; margin-bottom: 10px;">⚠️</div>
      <p
        style="margin-bottom: 10px; color: var(--text-color); font-weight: 600;"
      >
        Esta carpeta tiene gastos registrados.
      </p>
      <p class="warning-text">
        Si la borras, se eliminarán permanentemente todos los gastos fijos
        asociados a "{folderToMaybeDelete}".
      </p>
      <div class="modal-actions">
        <button
          class="btn-cancel"
          onclick={() => (showFolderDeleteConfirm = false)}
        >
          Cancelar
        </button>
        <button class="btn-delete" onclick={confirmDeleteFolder}>
          Borrar Todo
        </button>
      </div>
    </div>
  </Modal>

  <Modal
    isOpen={showNewFolderModal}
    close={() => (showNewFolderModal = false)}
    title="Nueva Carpeta"
    minimal={true}
  >
    <div style="display: flex; flex-direction: column; gap: 15px;">
      <div class="selector-group">
        <label
          for="folderName"
          style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 4px; display: block;"
          >Nombre de la carpeta</label
        >
        <input
          id="folderName"
          type="text"
          bind:value={newFolderName}
          placeholder="Ej: Mascotas, Viajes..."
          autocomplete="off"
          class="modal-input"
        />
      </div>
      <div class="selector-group">
        <label
          for="folderIcon"
          style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 4px; display: block;"
          >Emoji (Opcional)</label
        >
        <div style="display: flex; gap: 8px; align-items: center;">
          <input
            id="folderIcon"
            type="text"
            bind:value={newFolderIcon}
            placeholder="📁"
            maxlength="2"
            class="modal-input"
            style="width: 60px; text-align: center;"
          />
          <button
            type="button"
            class="add-btn"
            style="width: auto; padding: 10px 15px; font-size: 0.85rem;"
            onclick={() => (showEmojiPicker = !showEmojiPicker)}
          >
            {showEmojiPicker ? "Cerrar" : "Emojis"}
          </button>
        </div>

        {#if showEmojiPicker}
          <div
            class="emoji-picker-grid glass-card"
            transition:fade={{ duration: 150 }}
          >
            {#each commonEmojis as emoji}
              <button
                type="button"
                class="emoji-btn"
                onclick={() => {
                  newFolderIcon = emoji;
                  showEmojiPicker = false;
                }}
              >
                {emoji}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      <div style="display: flex; gap: 1rem; margin-top: 10px;">
        <button
          class="add-btn btn-cancel"
          style="flex: 1;"
          onclick={() => (showNewFolderModal = false)}>Cancelar</button
        >
        <button
          class="add-btn"
          style="flex: 1;"
          onclick={confirmNewFolder}
          disabled={!newFolderName.trim()}>Crear</button
        >
      </div>
    </div>
  </Modal>
</main>

<style>
  .delete-confirmation {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  .warning-text {
    color: #ff3e00;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  .modal-actions button {
    flex: 1;
    padding: 12px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  .btn-cancel {
    background: var(--input-bg);
    color: var(--text-color);
    border: 1px solid var(--glass-border);
  }
  .btn-delete {
    background: #ff3e00;
    color: white;
  }
  .modal-actions button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  .history-container {
    display: flex;
    flex-direction: column;
    height: calc(
      100vh - 330px
    ); /* Significantly reduced height to clear BottomNav */
    padding: 0;
    overflow: hidden;
    margin-top: 5px; /* Slight bump down from filters */
    margin-bottom: 20px;
  }
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    margin-bottom: 5px;
  }
  .view-header-actions {
    display: flex;
    justify-content: flex-end;
    padding: 0 15px 10px 15px;
  }
  .history-header h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-color);
  }

  .history-list {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
  }

  /* Safe spacer to prevent occlusion by BottomNav */
  .history-list::after {
    content: "";
    display: block;
    height: 90px;
  }

  /* Custom scrollbar for better aesthetics */
  .history-list::-webkit-scrollbar {
    width: 6px;
  }
  .history-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .history-list::-webkit-scrollbar-thumb {
    background: var(--glass-border);
    border-radius: 10px;
  }

  .tx-item {
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid var(--glass-border);
    padding: 12px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.2s;
  }

  .tx-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .tx-item:last-child {
    border-bottom: none;
  }

  .tx-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1; /* This will push the right actions to the end */
  }

  .tx-desc {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .tx-meta {
    font-size: 0.75rem;
    color: var(--text-dim);
  }

  .tx-right-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    gap: 4px; /* Reduced gap for tighter layout */
  }

  .tx-amount {
    font-weight: 700;
    font-size: 1rem;
    white-space: nowrap;
  }

  .more-btn {
    background: none;
    border: none;
    color: var(--text-dim);
    padding: 8px 4px; /* Narrower padding horizontally */
    cursor: pointer;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    opacity: 0.6;
  }

  .more-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-color);
  }

  .action-menu {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 5px;
  }

  .action-menu-header {
    padding: 5px 10px 15px;
    border-bottom: 1px solid var(--glass-border);
    margin-bottom: 10px;
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .item-desc {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--text-color);
  }

  .item-meta {
    font-size: 0.85rem;
    color: var(--text-dim);
  }

  .action-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 14px 15px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    color: var(--text-color);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: left;
  }

  .action-item:hover {
    background: rgba(255, 255, 255, 0.07);
    transform: translateY(-1px);
  }

  .action-item.danger {
    color: #ff4d4d;
    border-color: rgba(255, 77, 77, 0.2);
    background: rgba(255, 77, 77, 0.05);
  }

  .action-item.danger:hover {
    background: rgba(255, 77, 77, 0.1);
  }

  .action-item.cancel {
    justify-content: center;
    background: none;
    border: none;
    color: var(--text-dim);
    margin-top: 5px;
  }

  .pagination-footer {
    padding: 15px;
    border-top: 1px solid var(--glass-border);
    display: flex;
    justify-content: center;
    background: var(--input-bg);
  }

  .load-more-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition:
      transform 0.2s,
      opacity 0.2s;
    font-size: 0.9rem;
  }

  .load-more-btn:active {
    transform: scale(0.95);
  }

  .load-more-btn:hover {
    opacity: 0.9;
  }

  .add-btn-small {
    background: linear-gradient(135deg, var(--accent-color), #8b5cf6);
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .add-btn-small:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
    filter: brightness(1.1);
  }

  .add-btn-small:active {
    transform: translateY(0);
    filter: brightness(0.9);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .brand :global(.theme-toggle) {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 4px 6px;
    border-radius: 50%;
    opacity: 0.7;
    transition:
      opacity 0.2s,
      transform 0.2s;
    line-height: 1;
  }

  .brand :global(.theme-toggle:hover) {
    opacity: 1;
    transform: scale(1.15);
  }

  .brand :global(.theme-toggle .icon) {
    font-size: 1rem;
  }

  .brand .time-toggle.active {
    opacity: 1;
    filter: drop-shadow(0 0 8px var(--neon-green));
    transform: scale(1.15);
  }

  /* Folders Grid Styles */
  .folders-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 10px 15px 120px 15px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .folder-wrapper {
    position: relative;
    display: flex;
    height: 100%;
  }

  .folder-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px;
    cursor: pointer;
    border: 1px solid var(--glass-border);
    background: var(--card-bg);
    border-radius: 16px;
    text-align: center;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    width: 100%;
    min-height: 140px;
    color: inherit;
  }

  .folder-card:hover,
  .folder-card:active {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.4);
    background: var(--input-bg);
  }

  .folder-icon {
    font-size: 2.5rem;
    line-height: 1;
  }

  .folder-name {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text-color);
  }

  .folder-count {
    font-size: 0.75rem;
    color: var(--text-dim);
  }

  .delete-folder-btn {
    position: absolute;
    top: -5px;
    right: -5px;
    background: rgba(255, 77, 77, 0.9);
    color: white;
    border: none;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-weight: bold;
    font-size: 1.1rem;
    line-height: 1;
    opacity: 0;
    transition:
      opacity 0.2s,
      transform 0.2s;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(255, 77, 77, 0.4);
  }

  .delete-folder-btn:hover {
    transform: scale(1.1);
    background: #ff4d4d;
  }

  .folder-wrapper:hover .delete-folder-btn {
    opacity: 1;
  }

  .folder-wrapper.dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }

  .folder-wrapper[draggable="true"] {
    cursor: grab;
  }

  .folder-wrapper[draggable="true"]:active {
    cursor: grabbing;
  }

  .tx-cat-badge {
    color: var(--accent-color);
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.65rem;
    letter-spacing: 0.05em;
  }

  .chip-icon {
    font-size: 1.1rem;
  }

  .chip-label {
    font-size: 0.85rem;
    font-weight: 600;
  }

  /* Home scroll container for mobile safe layout */
  .home-scroll-container {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding-bottom: 20px;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .home-scroll-container::-webkit-scrollbar {
    display: none;
  }

  /* Historical Indicator */
  .historical-indicator {
    margin: 10px 0;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 243, 255, 0.05);
    border: 1px solid rgba(0, 243, 255, 0.2);
    border-radius: 14px;
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from {
      transform: translateY(-10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .indicator-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .indicator-icon {
    font-size: 1.4rem;
  }

  .indicator-text {
    display: flex;
    flex-direction: column;
  }

  .indicator-text .label {
    font-size: 0.7rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .indicator-text .period {
    font-size: 0.9rem;
    font-weight: 800;
    color: var(--neon-blue);
  }

  .return-btn {
    background: rgba(0, 243, 255, 0.1);
    border: 1px solid var(--neon-blue);
    color: var(--neon-blue);
    padding: 6px 14px;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .return-btn:hover {
    background: var(--neon-blue);
    color: var(--bg-color);
    box-shadow: 0 0 10px rgba(0, 243, 255, 0.3);
  }

  .modal-input {
    width: 100%;
    color: var(--text-color) !important;
    background: var(--input-bg) !important;
  }

  .modal-input::placeholder {
    color: var(--text-dim) !important;
    opacity: 0.7;
  }

  .emoji-picker-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
    padding: 12px;
    margin-top: 10px;
    max-height: 180px;
    overflow-y: auto;
    background: var(--input-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
  }

  .emoji-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    padding: 4px;
    cursor: pointer;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .emoji-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .full-history {
    overflow: hidden;
    min-height: 0;
  }
</style>
