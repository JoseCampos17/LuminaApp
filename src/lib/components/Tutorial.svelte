<script lang="ts">
  import { TutorialState } from "$lib/logic/TutorialState.svelte";

  let props = $props<{
    step: number;
    onNext: () => void;
    onComplete: () => void;
  }>();

  const state = new TutorialState({
    get step() {
      return props.step;
    },
    get onNext() {
      return props.onNext;
    },
    get onComplete() {
      return props.onComplete;
    },
  });
</script>

<div class="tutorial-overlay">
  <div class="tutorial-card glass-card">
    {#if state.step === 0}
      <h3>¡Bienvenido a Lumina! 💎</h3>
      <p>
        Tu nuevo asistente financiero 100% privado y offline. Te enseñaré lo
        básico en 3 pasos.
      </p>
      <button class="add-btn" onclick={state.next}>Siguiente</button>
    {:else}
      {#if state.step === 1}
        <h4>1. Configura tu Base ⚙️</h4>
        <p>
          Usa el engranaje arriba para registrar tu salario y gastos fijos
          (arriendo, servicios, etc.).
        </p>
      {:else if state.step === 2}
        <h4>2. Registra el Día a Día ➕</h4>
        <p>
          Usa el botón "+" para anotar tus gastos variables. Lumina te avisará
          si gastas mucho de golpe.
        </p>
      {:else if state.step === 3}
        <h4>3. Mira el Futuro 🚀</h4>
        <p>
          El cohete proyecta tus ahorros basados en lo que realmente te queda
          libre. ¡Hazlo crecer!
        </p>
      {/if}
      <div class="tutorial-actions">
        {#if state.step < 3}
          <button class="link-btn" onclick={state.next}>Entendido</button>
        {:else}
          <button class="add-btn" onclick={state.complete}
            >¡Empezar ahora!</button
          >
        {/if}
      </div>
    {/if}
  </div>
</div>
