// ============================================================
// UI Store — Modal visibility & tutorial state for Lumina
// Uses a single $state object (Svelte 5 module store pattern)
// so that properties are directly mutable from other files.
// ============================================================

import type { Transaction } from "$lib/types";

export const uiState = $state({
  showTransactionModal: false,
  showSettingsModal: false,
  showSavingsModal: false,
  showHistoryModal: false,
  showEditModal: false,
  showRecurringModal: false,

  editingTransaction: null as Transaction | null,
  editingRecurring: null as any | null,
  showTutorial: false,
  tutorialStep: 0,

  activeTab: 'home' as 'home' | 'history' | 'recurring' | 'settings',

  // Generic info modal
  showInfoModal: false,
  infoModalTitle: "",
  infoModalText: "",
});

// ─── Actions ─────────────────────────────────────────────────────────────────

export function startEdit(tx: Transaction) {
  uiState.editingTransaction = tx;
  uiState.showEditModal = true;
}

export function clearEdit() {
  uiState.editingTransaction = null;
  uiState.showEditModal = false;
}

export function completeTutorial() {
  localStorage.setItem("lumina_onboarded", "true");
  uiState.showTutorial = false;
}

export function initTutorial() {
  if (!localStorage.getItem("lumina_onboarded")) {
    uiState.showTutorial = true;
  }
}

export function openInfoModal(title: string, text: string) {
  uiState.infoModalTitle = title;
  uiState.infoModalText = text;
  uiState.showInfoModal = true;
}
