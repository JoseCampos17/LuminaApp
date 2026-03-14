<script lang="ts">
  import { fade, scale } from "svelte/transition";

  let { isOpen, close, title, children, minimal = false, zIndex = 1000 } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  function portal(node: HTMLElement) {
    if (typeof document !== "undefined") {
      document.body.appendChild(node);
      return {
        destroy() {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        }
      };
    }
    return {};
  }
</script>

{#if isOpen}
  <div
    class="modal-backdrop"
    style="z-index: {zIndex};"
    onclick={close}
    onkeydown={(e) => e.key === "Escape" && close()}
    transition:fade={{ duration: 200 }}
    role="button"
    tabindex="0"
    aria-label="Cerrar modal"
    use:portal
  >
    <div
      class="modal-content glass-card"
      class:minimal
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      transition:scale={{ duration: 300, start: 0.95 }}
      role="dialog"
      tabindex="-1"
    >
      {#if !minimal}
        <div class="modal-header">
          <h2>{title}</h2>
          <button class="close-btn" onclick={close}>&times;</button>
        </div>
      {/if}
      <div class="modal-body">
        {@render children()}
      </div>
    </div>
  </div>
{/if}
