<script lang="ts">
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  let { onComplete } = $props<{ onComplete: () => void }>();

  let currentSlide = $state(0);
  let direction = $state(1); // 1 = forward, -1 = backward

  const slides = [
    {
      emoji: "✨",
      title: "Bienvenido a Lumina",
      text: "Tu cerebro financiero personal. 100% privado, sin nube, sin servidores. Tus datos son solo tuyos.",
      color: "var(--neon-blue)",
    },
    {
      emoji: "🎯",
      title: "El Radar de Liquidez",
      text: "Es tu termómetro financiero. Indica qué porcentaje de tu ingreso aún tienes disponible. 100% = todo libre.",
      color: "var(--neon-purple)",
    },
    {
      emoji: "📅",
      title: "Quincena y Mes",
      text: "Lumina divide tu sueldo en períodos automáticamente. Cambia entre Quincena y Mes para ver cómo cambia tu balance.",
      color: "var(--neon-green)",
    },
    {
      emoji: "🚀",
      title: "¡Estás listo!",
      text: "Ve a la pestaña Config para ingresar tu salario y comenzar a usar Lumina al máximo.",
      color: "#f59e0b",
    },
  ];

  function next() {
    if (currentSlide < slides.length - 1) {
      direction = 1;
      currentSlide++;
    } else {
      done();
    }
  }

  function prev() {
    if (currentSlide > 0) {
      direction = -1;
      currentSlide--;
    }
  }

  function done() {
    localStorage.setItem("lumina_onboarded", "true");
    onComplete();
  }
</script>

<div class="onboarding-backdrop">
  <div class="onboarding-card glass-card">
    <!-- Slide -->
    {#key currentSlide}
      <div
        class="slide"
        in:fly={{ x: direction * 60, duration: 300, easing: cubicOut }}
      >
        <div class="slide-emoji" style="color: {slides[currentSlide].color}">
          {slides[currentSlide].emoji}
        </div>
        <h2 class="slide-title" style="color: {slides[currentSlide].color}">
          {slides[currentSlide].title}
        </h2>
        <p class="slide-text">{slides[currentSlide].text}</p>
      </div>
    {/key}

    <!-- Dots -->
    <div class="dots">
      {#each slides as _, i}
        <span class="dot {i === currentSlide ? 'active' : ''}"></span>
      {/each}
    </div>

    <!-- Actions -->
    <div class="onboarding-actions">
      {#if currentSlide > 0}
        <button class="ob-btn secondary" onclick={prev}>Atrás</button>
      {:else}
        <button class="ob-btn ghost" onclick={done}>Saltar</button>
      {/if}

      <button
        class="ob-btn primary"
        style="background: linear-gradient(90deg, {slides[currentSlide].color}, var(--neon-purple));"
        onclick={next}
      >
        {currentSlide === slides.length - 1 ? "¡Comenzar! 🎉" : "Siguiente →"}
      </button>
    </div>
  </div>
</div>
