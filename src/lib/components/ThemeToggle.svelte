<script lang="ts">
  import { ThemeToggleState } from "$lib/logic/ThemeToggleState.svelte";

  const state = new ThemeToggleState();
</script>

<button
  class="theme-toggle"
  onclick={state.toggleTheme}
  aria-label="Toggle Theme"
>
  {#if state.theme === "dark"}
    <span class="icon">🌙</span>
  {:else if state.theme === "light"}
    <span class="icon">☀️</span>
  {:else}
    <span class="icon">🌸</span>
  {/if}
</button>
