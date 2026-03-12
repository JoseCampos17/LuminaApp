<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import type { DashboardState } from "$lib/logic/DashboardState.svelte";

  let { dash }: { dash: DashboardState } = $props();
</script>

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
