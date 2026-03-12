<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";

  let { isOpen, close, type, item, onEdit, onDelete } = $props<{
    isOpen: boolean;
    close: () => void;
    type: "transaction" | "folder" | "recurring" | null;
    item: any;
    onEdit: (item: any, type: string) => void;
    onDelete: (item: any, type: string) => void;
  }>();
</script>

<Modal {isOpen} {close} title="Opciones" minimal={true}>
  <div class="action-menu">
    <div class="action-menu-header">
      <div class="item-info">
        {#if type === "folder"}
          <span
            class="item-desc"
            style="display:flex; align-items:center; gap:6px;"
          >
            <span style="font-size:1.2rem;">{item?.icon || "📁"}</span>
            {item?.name || "Carpeta"}
          </span>
        {:else}
          <span class="item-desc">{item?.description || "Sin descripción"}</span
          >
          <span class="item-meta"
            >{item?.category || item?.frequency || ""}
            •
            {item?.date ||
              (item?.day_of_month ? "Día " + item.day_of_month : "")}</span
          >
        {/if}
      </div>
    </div>
    <button
      class="action-item"
      onclick={() => {
        close();
        onEdit(item, type!);
      }}
    >
      <span class="icon">✏️</span>
      <span class="label">Editar</span>
    </button>
    <button
      class="action-item danger"
      onclick={() => {
        close();
        onDelete(item, type!);
      }}
    >
      <span class="icon">🗑️</span>
      <span class="label">Eliminar</span>
    </button>
    <button class="action-item cancel" onclick={close}> Cancelar </button>
  </div>
</Modal>

<style>
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
</style>
