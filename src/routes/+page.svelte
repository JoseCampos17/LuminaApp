<script lang="ts">
  import { DashboardState } from "$lib/logic/DashboardState.svelte";
  import { deleteTransaction } from "$lib/stores/finance.svelte";

  // ── Components ────────────────────────────────────────────────────────────
  import Modal from "$lib/components/Modal.svelte";
  import TransactionForm from "$lib/components/TransactionForm.svelte";
  import SalaryConfig from "$lib/components/SalaryConfig.svelte";
  import CurrencyToggle from "$lib/components/CurrencyToggle.svelte";
  import CurrencyRates from "$lib/components/CurrencyRates.svelte";
  import RecurringExpenses from "$lib/components/RecurringExpenses.svelte";
  import SavingsSimulator from "$lib/components/SavingsSimulator.svelte";
  import FinancialInsights from "$lib/components/FinancialInsights.svelte";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import Tutorial from "$lib/components/Tutorial.svelte";
  import BottomNav from "$lib/components/BottomNav.svelte";

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

  function handleCurrencySelection(opt: string) {
    if (dash.finance.localCurrency === opt) return;
    pendingCurrency = opt;
    showCurrencyConfirmModal = true;
  }

  async function confirmCurrencyChange() {
    if (pendingCurrency) {
      await dash.clearAllData();
      dash.setLocalCurrency(pendingCurrency);
      showCurrencyConfirmModal = false;
      pendingCurrency = null;
    }
  }

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
</script>

<main class="dashboard {dash.ui.activeTab}">
  <!-- ─── Header ──────────────────────────────────────────────────────────── -->
  <header class="top-nav">
    <div class="brand">
      <h1 class="gradient-text">Lumina</h1>
      <ThemeToggle />
    </div>
    <div class="actions">
      <CurrencyToggle
        currency={dash.finance.currency}
        currencies={dash.toggleOptions().map((code) => ({
          code,
          locale: code === "USD" ? "en-US" : code === "CLP" ? "es-CL" : "es-CO",
          decimals: code === "USD" ? 2 : 0,
          rateToUsd: 1,
        }))}
        onToggle={(val) => (dash.finance.currency = val)}
      />
    </div>
  </header>

  {#if dash.ui.activeTab === "home"}
    <!-- ─── VIEW: HOME ────────────────────────────────────────────────────── -->
    <!-- ─── Liquidity Radar ──────────────────────────────────────────────────── -->
    <section class="main-radar">
      <div class="view-selector glass-card">
        <button
          class:active={dash.finance.viewMode === "quincena"}
          onclick={() => (dash.finance.viewMode = "quincena")}>Quincena</button
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
        <span class="label"
          >Disponible {dash.isMonthly() ? "del Mes" : "Quincenal"}</span
        >
        <span class="value"
          >{dash.formatCurrency(dash.displayBudgetRemaining())}</span
        >
      </div>
    </section>

    <!-- ─── Summary Cards ──────────────────────────────────────────────────── -->
    <section class="summary-cards">
      <div class="card glass-card">
        <span class="card-label">Ingreso Neto</span>
        <span class="card-value"
          >{dash.formatCurrency(dash.displayNetIncome())}</span
        >
        <span class="card-hint"
          >Base {dash.isMonthly() ? "30 días" : "15 días"}</span
        >
      </div>
      <div class="card glass-card">
        <span class="card-label">Gastos Variables</span>
        <span class="card-value negative"
          >{dash.formatCurrency(dash.displayVariableExpenses())}</span
        >
        <span class="card-hint"
          >Total {dash.isMonthly() ? "Mes" : "Quincena"}</span
        >
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
            class="tx-item glass-card swipeable"
            class:disappearing={txDisappearingId === tx.id}
            style={txSwipingId === tx.id
              ? `transform: translateX(${txSwipeOffset}px)`
              : ""}
            ontouchstart={(e) => handleTxTouchStart(e, tx.id)}
            ontouchmove={handleTxTouchMove}
            ontouchend={(e) => handleTxTouchEnd(e, tx)}
            onmousedown={(e) => handleTxTouchStart(e, tx.id)}
            onmousemove={handleTxTouchMove}
            onmouseup={(e) => handleTxTouchEnd(e, tx)}
            onmouseleave={(e) => handleTxTouchEnd(e, tx)}
            onclick={() => handleClickTxEdit(tx)}
            role="button"
            tabindex="0"
            onkeypress={(e) => e.key === "Enter" && handleClickTxEdit(tx)}
          >
            <div class="tx-left">
              <span class="tx-desc">{tx.description}</span>
              <span class="tx-meta">{tx.category} • {tx.date}</span>
            </div>
            <div class="tx-right-actions">
              <span class="tx-amount {tx.amount > 0 ? 'positive' : 'negative'}">
                {tx.amount > 0 ? "+" : ""}{dash.formatCurrency(
                  Math.abs(tx.amount),
                )}
              </span>
              <div class="delete-backdrop"></div>
            </div>
          </div>
        {/each}
        {#if dash.currentPeriodTransactions().length === 0}
          <p class="empty">No hay movimientos.</p>
        {/if}
      </div>
    </section>
  {:else if dash.ui.activeTab === "history"}
    <!-- ─── VIEW: HISTORY ────────────────────────────────────────────────── -->
    <section class="full-history">
      <div class="history-container glass-card">
        <div class="history-list" onscroll={handleScroll}>
          {#each dash
            .currentPeriodTransactions()
            .slice(0, visibleRecords) as tx, index}
            <div
              class="tx-item swipeable"
              class:disappearing={txDisappearingId === tx.id}
              style={txSwipingId === tx.id
                ? `transform: translateX(${txSwipeOffset}px)`
                : ""}
              ontouchstart={(e) => handleTxTouchStart(e, tx.id)}
              ontouchmove={handleTxTouchMove}
              ontouchend={(e) => handleTxTouchEnd(e, tx)}
              onmousedown={(e) => handleTxTouchStart(e, tx.id)}
              onmousemove={handleTxTouchMove}
              onmouseup={(e) => handleTxTouchEnd(e, tx)}
              onmouseleave={(e) => handleTxTouchEnd(e, tx)}
              onclick={() => handleClickTxEdit(tx)}
              role="button"
              tabindex="0"
              onkeypress={(e) => e.key === "Enter" && handleClickTxEdit(tx)}
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
                  {tx.amount > 0 ? "+" : ""}{dash.formatCurrency(
                    Math.abs(tx.amount),
                  )}
                </span>
                <div class="delete-backdrop"></div>
              </div>
            </div>
          {/each}
          {#if dash.currentPeriodTransactions().length === 0}
            <p class="empty">No se encontraron movimientos en este periodo.</p>
          {/if}
        </div>
      </div>
    </section>
  {:else if dash.ui.activeTab === "recurring"}
    <!-- ─── VIEW: RECURRING FIXED EXPENSES ─────────────────────────────── -->
    <section class="full-history">
      <div class="history-header" style="justify-content: flex-end;">
        <button
          class="add-btn-small"
          onclick={() => (dash.ui.showRecurringModal = true)}
        >
          + Agregar
        </button>
      </div>

      <div
        class="history-container glass-card"
        style="margin-bottom: 80px; overflow: hidden;"
      >
        <div class="history-list">
          {#each dash.finance.recurringExpenses as exp}
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
                  {dash.formatCurrency(exp.amount)}
                </span>
                <div class="delete-backdrop"></div>
              </div>
            </div>
          {/each}
          {#if dash.finance.recurringExpenses.length === 0}
            <p class="empty">
              No hay gastos fijos registrados. Agrega uno en el botón (+).
            </p>
          {/if}
        </div>
      </div>
    </section>
  {:else if dash.ui.activeTab === "settings"}
    <!-- ─── VIEW: SETTINGS ───────────────────────────────────────────────── -->
    <section class="full-settings">
      <div class="settings-content">
        <CurrencyRates currencies={dash.finance.currencies} />

        <div class="local-currency-box glass-card">
          <span class="label">Divisa Local 🌍</span>
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
        />
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
    title="¿Cambiar Divisa Local?"
    minimal={true}
  >
    <div style="text-align: center;">
      <div style="font-size: 2.5rem; margin-bottom: 10px;">⚠️</div>
      <h3 style="margin: 0 0 10px;">¿Cambiar a {pendingCurrency}?</h3>
      <p style="margin-bottom: 25px; color: var(--text-dim);">
        Al cambiar la divisa local, <strong>se borrarán permanentemente</strong>
        todos tus movimientos, gastos fijos y configuración de salario actuales.<br
        /><br />
        Esto es necesario para mantener la coherencia de tus finanzas.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button
          class="add-btn"
          style="background: var(--surface-light); color: var(--text-color); flex: 1;"
          onclick={() => (showCurrencyConfirmModal = false)}>Cancelar</button
        >
        <button
          class="add-btn"
          style="background: rgba(255, 60, 60, 0.2); color: #ff4d4d; flex: 1;"
          onclick={confirmCurrencyChange}>Confirmar y Borrar</button
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
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-color);
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
    height: calc(100vh - 210px); /* Slightly smaller for better fit */
    padding: 0;
    overflow: hidden;
    margin-top: 10px;
    margin-bottom: 20px; /* Added spacing from the bottom menu */
  }

  .history-list {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
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
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .pagination-footer {
    padding: 15px;
    border-top: 1px solid var(--glass-border);
    display: flex;
    justify-content: center;
    background: rgba(255, 255, 255, 0.02);
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
</style>
