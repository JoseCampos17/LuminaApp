<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";

  let {
    isOpen,
    close,
    title,
    message,
    targetDescription,
    onConfirm,
    confirmLabel = "Eliminar",
    cancelLabel = "Cancelar",
    danger = true,
  }: {
    isOpen: boolean;
    close: () => void;
    title: string;
    message: string;
    targetDescription?: string | null;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
  } = $props();
</script>

<Modal {isOpen} {close} {title} minimal={true}>
  <div style="text-align: center;">
    <div style="font-size: 2.5rem; margin-bottom: 10px;">
      {danger ? "🗑️" : "✏️"}
    </div>
    <h3 style="margin: 0 0 10px;">{title}</h3>
    <p style="margin-bottom: 25px; color: var(--text-dim);">
      {message}
      {#if targetDescription}
        <br /><strong>{targetDescription}</strong>
      {/if}
    </p>
    <div style="display: flex; gap: 1rem; justify-content: center;">
      <button
        class="add-btn"
        style="background: var(--surface-light); color: var(--text-color); flex: 1;"
        onclick={close}>{cancelLabel}</button
      >
      <button
        class="add-btn"
        style="background: {danger
          ? 'rgba(255, 60, 60, 0.2)'
          : 'var(--accent-color)'}; color: {danger
          ? '#ff4d4d'
          : 'white'}; flex: 1;"
        onclick={onConfirm}>{confirmLabel}</button
      >
    </div>
  </div>
</Modal>
