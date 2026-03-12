<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    id,
    disabled = false,
    disappearing = false,
    onDeleteTrigger,
    onclick,
    children,
  } = $props<{
    id: string | number;
    disabled?: boolean;
    disappearing?: boolean;
    onDeleteTrigger: (id: string | number) => void;
    onclick?: () => void;
    children: Snippet;
  }>();

  let swipeOffset = $state(0);
  let isSwiping = $state(false);

  function handleTouchStart(e: TouchEvent | MouseEvent) {
    if (disabled) return;
    isSwiping = true;
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
    if (!isSwiping || disabled) return;
    const startX = parseFloat(
      (e.currentTarget as HTMLElement)?.getAttribute("data-start-x") || "0",
    );
    const clientX =
      window.TouchEvent && e instanceof TouchEvent
        ? e.touches[0].clientX
        : (e as MouseEvent).clientX;
    const diff = clientX - startX;

    if (diff < 0) {
      swipeOffset = Math.max(diff, -150); // Max swipe left
    } else {
      swipeOffset = 0;
    }
  }

  function handleTouchEnd(e: TouchEvent | MouseEvent) {
    if (!isSwiping || disabled) return;

    // Threshold for triggering delete
    if (swipeOffset <= -80) {
      onDeleteTrigger(id);
    }

    // Reset visually
    isSwiping = false;
    swipeOffset = 0;
  }
</script>

<div class="swipeable-wrapper" class:disappearing>
  <div
    class="swipe-actions"
    style="opacity: {Math.abs(swipeOffset) / 80}; visibility: {swipeOffset === 0
      ? 'hidden'
      : 'visible'}"
  >
    <div class="delete-bg">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        width="24"
        height="24"
      >
        <polyline points="3 6 5 6 21 6"></polyline>
        <path
          d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        ></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    </div>
  </div>

  <div
    class="swipeable-content {disabled ? '' : 'swipeable'}"
    style={swipeOffset ? `transform: translateX(${swipeOffset}px)` : ""}
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
    onmousedown={handleTouchStart}
    onmousemove={handleTouchMove}
    onmouseup={handleTouchEnd}
    onmouseleave={handleTouchEnd}
    {onclick}
    onkeypress={(e) => {
      if (e.key === "Enter" && onclick) onclick();
    }}
    role="button"
    tabindex="0"
  >
    {@render children()}
  </div>
</div>

<style>
  .swipeable-wrapper {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 4px;
    transition: all 0.3s ease;
  }

  .swipe-actions {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ff3e00;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-right: 20px;
    border-radius: 12px;
    z-index: 0;
  }

  .delete-bg {
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .swipeable-content {
    position: relative;
    z-index: 1;
    background: var(--bg-color); /* Use base bg to prevent bleeding */
    background-image: linear-gradient(
      var(--card-bg),
      var(--card-bg)
    ); /* Overlay card-bg */
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px var(--shadow-color);
    transition: transform 0.2s ease-out;
    width: 100%;
  }

  .swipeable-content.swipeable {
    touch-action: pan-y; /* Allow vertical scrolling, intercept horizontal for swipe */
  }

  .disappearing {
    opacity: 0;
    transform: scale(0.95);
    margin-bottom: -60px; /* Collapse space */
    pointer-events: none;
  }
</style>
