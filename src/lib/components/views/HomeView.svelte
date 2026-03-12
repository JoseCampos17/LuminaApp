<script lang="ts">
  import { fade } from "svelte/transition";
  import FinancialInsights from "$lib/components/FinancialInsights.svelte";
  import SwipeableItem from "$lib/components/ui/SwipeableItem.svelte";

  let {
    dash,
    monthNames,
    txDisappearingId,
    onEditTransaction,
    onDeleteTrigger,
    onActionMenu,
  } = $props<{
    dash: any; // DashboardState
    monthNames: string[];
    txDisappearingId: string | null;
    onEditTransaction: (tx: any) => void;
    onDeleteTrigger: (tx: any) => void;
    onActionMenu: (
      tx: any,
      type: "transaction" | "recurring" | "folder",
    ) => void;
  }>();
</script>

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
        <text class="radar-text" x="50" y="52">{dash.displayRadarValue()}%</text
        >
        <text class="radar-label-small" x="50" y="62">LIQUIDEZ</text>
      </svg>
    </div>
    <div class="radar-info">
      <span class="label">
        {dash.isCurrentPeriod()
          ? dash.isMonthly()
            ? "Disponible"
            : "Disponible"
          : "Balance de Cierre"}
      </span>
      <span class="value" class:negative={dash.displayBudgetRemaining() < 0}>
        {dash.formatCurrency(dash.displayBudgetRemaining())}
      </span>
    </div>
  </section>

  <!-- ─── Summary Cards ──────────────────────────────────────────────────── -->
  <section class="summary-cards">
    <div class="card glass-card">
      <span class="card-label">Ingreso Neto</span>
      <span class="card-value">
        {dash.formatCurrency(dash.displayNetIncome())}
      </span>
    </div>
    <div class="card glass-card">
      <span class="card-label">Ingresos Extra</span>
      <span class="card-value positive">
        {dash.formatCurrency(dash.displayExtraIncome())}
      </span>
    </div>
    <div class="card glass-card">
      <span class="card-label">Gastos Fijos</span>
      <span class="card-value negative">
        {dash.formatCurrency(dash.displayRecurring())}
      </span>
    </div>
    <div class="card glass-card">
      <span class="card-label">Gastos Variables</span>
      <span class="card-value negative">
        {dash.formatCurrency(dash.displayVariableExpenses())}
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
      isCurrentPeriod={dash.isCurrentPeriod()}
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
          onclick={() => (dash.ui.activeTab = "history")}
        >
          Ver todo
        </button>
      </div>
    </div>
    <div class="tx-scroll">
      {#each dash.currentPeriodTransactions().slice(0, 2) as tx, i}
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
              <span class="tx-desc">{tx.description}</span>
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
      {#if dash.currentPeriodTransactions().length === 0}
        <p class="empty">
          No hay movimientos en {monthNames[dash.finance.selectedMonth]} de {dash
            .finance.selectedYear}.
        </p>
      {/if}
    </div>
  </section>
</div>


