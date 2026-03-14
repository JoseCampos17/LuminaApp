import { onMount } from "svelte";
import {
  financeState,
  loadData,
  deleteTransaction,
  formatCurrency,
  formatLocalAmount,
  setLocalCurrency,
  handleRatesUpdated,
  isMonthly,
  currentPeriodTransactions,
  displayNetIncome,
  displayBudgetRemaining,
  displayRadarValue,
  displayVariableExpenses,
  displayRecurring,
  displayExtraIncome,
  toggleOptions,
  clearAllData,
  getFilteredRecurring,
  isCurrentPeriod,
  currentPeriodLabel,
} from "$lib/stores/finance.svelte";

import {
  uiState,
  startEdit,
  clearEdit,
  completeTutorial,
  initTutorial,
} from "$lib/stores/ui.svelte";

import { checkSpendingAlert } from "$lib/alerts";
import { notificationService } from "$lib/logic/NotificationService.svelte";

export class DashboardState {
  constructor() {
    onMount(() => {
      loadData();
      initTutorial();
      // Request notification permission on first launch if not yet granted
      notificationService.requestPermissionOnStartup();
    });
  }

  // Proxies to global state
  get finance() {
    return financeState;
  }
  get ui() {
    return uiState;
  }

  // Delegated methods
  loadData = loadData;
  deleteTransaction = deleteTransaction;
  formatCurrency = formatCurrency;
  formatLocalAmount = formatLocalAmount;
  setLocalCurrency = setLocalCurrency;
  handleRatesUpdated = handleRatesUpdated;
  isMonthly = isMonthly;
  currentPeriodTransactions = currentPeriodTransactions;
  displayNetIncome = displayNetIncome;
  displayBudgetRemaining = displayBudgetRemaining;
  displayRadarValue = displayRadarValue;
  displayVariableExpenses = displayVariableExpenses;
  displayRecurring = displayRecurring;
  displayExtraIncome = displayExtraIncome;
  toggleOptions = toggleOptions;
  clearAllData = clearAllData;
  getFilteredRecurring = getFilteredRecurring;
  isCurrentPeriod = isCurrentPeriod;
  currentPeriodLabel = currentPeriodLabel;

  startEdit = startEdit;
  clearEdit = clearEdit;
  completeTutorial = completeTutorial;

  handleTransactionAdded = async (amount?: number) => {
    this.ui.showTransactionModal = false;
    await this.loadData();
    await checkSpendingAlert(
      this.finance.salaryUSD,
      this.finance.recurringExpenses,
      this.finance.transactions,
      amount,
    );
    // Check and fire system notifications
    await notificationService.checkAndNotify({
      liquidityPercent: displayRadarValue(),
      netIncome: displayNetIncome(),
      variableExpenses: displayVariableExpenses(),
      recurringExpenses: this.finance.recurringExpenses as any[],
    });
  };

  handleEditComplete = async () => {
    this.clearEdit();
    await this.loadData();
  };
}
