<script lang="ts">
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";

  let { dash } = $props<{ dash: any }>();
</script>

<header class="top-nav">
  <div class="brand">
    <h1 class="gradient-text">Lumina</h1>
    <ThemeToggle />
    <button
      class="theme-toggle time-toggle"
      class:active={dash.finance.isTimeMode}
      onclick={() => (dash.finance.isTimeMode = !dash.finance.isTimeMode)}
      title="Modo Tiempo-Vida (Time = Money)"
    >
      <span class="icon">{dash.finance.isTimeMode ? "⏳" : "⌛"}</span>
    </button>
  </div>
</header>
