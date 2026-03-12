<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import { fade } from "svelte/transition";
  import { commonEmojis } from "$lib/constants/emojis";

  let {
    isOpen,
    close,
    newFolderName = $bindable(),
    newFolderIcon = $bindable(),
    editingCategoryName,
    onConfirm,
  }: {
    isOpen: boolean;
    close: () => void;
    newFolderName: string;
    newFolderIcon: string;
    editingCategoryName: string | null;
    onConfirm: () => void;
  } = $props();

  let showEmojiPicker = $state(false);
</script>

<Modal
  {isOpen}
  {close}
  title={editingCategoryName ? "Editar Carpeta" : "Nueva Carpeta"}
  minimal={true}
>
  <div class="premium-modal-content">
    <!-- Preview Header -->
    <div class="preview-header">
      <button
        type="button"
        class="icon-preview-circle"
        onclick={() => (showEmojiPicker = !showEmojiPicker)}
        title="Cambiar emoji"
      >
        <span class="preview-emoji">{newFolderIcon || "📁"}</span>
        <div class="edit-badge">
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          >
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
            ></path>
          </svg>
        </div>
      </button>
      <div class="preview-info">
        <span class="preview-label">PREVISUALIZACIÓN</span>
        <h3 class="preview-name">{newFolderName || "Sin nombre"}</h3>
      </div>
    </div>

    <!-- Main Content -->
    <div class="modal-body-content">
      <div class="input-section">
        <label for="folderName">Nombre de la carpeta</label>
        <input
          id="folderName"
          type="text"
          bind:value={newFolderName}
          placeholder="Ej: Mascotas, Viajes..."
          autocomplete="off"
          class="premium-input"
        />
      </div>

      <!-- Emoji Picker (Popover centered) -->
      {#if showEmojiPicker}
        <div
          class="emoji-popover glass-card"
          transition:fade={{ duration: 150 }}
        >
          <div class="popover-header">
            <span>Selecciona un Emoji</span>
            <button
              type="button"
              class="mini-close"
              onclick={() => (showEmojiPicker = false)}>&times;</button
            >
          </div>
          <div class="emoji-grid-scroll">
            {#each commonEmojis as emoji}
              <button
                type="button"
                class="emoji-item-btn"
                onclick={() => {
                  newFolderIcon = emoji;
                  showEmojiPicker = false;
                }}
              >
                {emoji}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer Actions -->
    <div class="modal-footer">
      <button class="action-btn cancel" onclick={close}>Cancelar</button>
      <button
        class="action-btn confirm"
        onclick={onConfirm}
        disabled={!newFolderName.trim()}
      >
        {editingCategoryName ? "Actualizar" : "Crear Carpeta"}
      </button>
    </div>
  </div>
</Modal>

<style>
  .premium-modal-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 10px 5px;
  }

  /* Preview Header */
  .preview-header {
    display: flex;
    align-items: center;
    gap: 20px;
    background: rgba(255, 255, 255, 0.03);
    padding: 18px;
    border-radius: 20px;
    border: 1px solid var(--glass-border);
  }

  .icon-preview-circle {
    position: relative;
    width: 70px;
    height: 70px;
    border-radius: 22px;
    background: var(--input-bg);
    border: 1.5px solid var(--glass-border);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    padding: 0;
  }

  .icon-preview-circle:hover {
    transform: scale(1.05);
    border-color: var(--accent-color);
    box-shadow: 0 0 20px rgba(0, 243, 255, 0.15);
  }

  .preview-emoji {
    font-size: 2.2rem;
  }

  .edit-badge {
    position: absolute;
    bottom: -5px;
    right: -5px;
    background: var(--accent-color);
    color: white;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--modal-bg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .preview-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }

  .preview-label {
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: var(--text-dim);
  }

  .preview-name {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 600;
  }

  /* Input Section */
  .modal-body-content {
    position: relative;
  }

  .input-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input-section label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-dim);
    margin-left: 4px;
  }

  .premium-input {
    width: 100%;
    padding: 14px 18px !important;
    border-radius: 14px !important;
    font-size: 1rem !important;
    transition: all 0.3s !important;
  }

  /* Emoji Popover */
  .emoji-popover {
    position: absolute;
    top: -180px; /* Positions it above the input */
    left: 0;
    right: 0;
    z-index: 100;
    background: var(--modal-bg) !important;
    border: 1px solid var(--accent-color) !important;
    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.5) !important;
    padding: 15px !important;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-radius: 20px !important;
  }

  .popover-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 5px;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-dim);
  }

  .mini-close {
    background: none;
    border: none;
    color: var(--text-dim);
    font-size: 1.2rem;
    cursor: pointer;
    line-height: 1;
  }

  .emoji-grid-scroll {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 5px;
  }

  .emoji-item-btn {
    background: none;
    border: none;
    font-size: 1.6rem;
    padding: 8px;
    cursor: pointer;
    border-radius: 12px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .emoji-item-btn:hover {
    background: rgba(0, 243, 255, 0.1);
    transform: scale(1.15);
  }

  /* Footer Actions */
  .modal-footer {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    flex: 1;
    padding: 16px;
    border-radius: 16px;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
  }

  .action-btn.cancel {
    background: var(--input-bg);
    color: var(--text-color);
    border: 1.5px solid var(--glass-border);
  }

  .action-btn.cancel:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .action-btn.confirm {
    background: linear-gradient(
      135deg,
      var(--accent-color),
      var(--neon-purple)
    );
    color: white;
    box-shadow: 0 4px 15px rgba(0, 243, 255, 0.2);
  }

  .action-btn.confirm:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 243, 255, 0.3);
  }

  .action-btn.confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(1);
  }

  /* Scrollbar refine */
  .emoji-grid-scroll::-webkit-scrollbar {
    width: 4px;
  }
  .emoji-grid-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .emoji-grid-scroll::-webkit-scrollbar-thumb {
    background: var(--glass-border);
    border-radius: 10px;
  }
</style>
