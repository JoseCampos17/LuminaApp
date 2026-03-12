<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import SavingsSimulator from "$lib/components/SavingsSimulator.svelte";
  import type { DashboardState } from "$lib/logic/DashboardState.svelte";

  let { dash }: { dash: DashboardState } = $props();
</script>

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
