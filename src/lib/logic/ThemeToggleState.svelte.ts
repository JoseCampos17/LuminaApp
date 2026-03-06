import { onMount } from "svelte";

export class ThemeToggleState {
  isDark = $state(true);

  constructor() {
    onMount(() => {
      const saved = localStorage.getItem("lumina-theme");
      if (saved === "light") {
        this.isDark = false;
        this.applyTheme();
      } else if (saved === "dark") {
        this.isDark = true;
        this.applyTheme();
      } else {
        const prefersLight = window.matchMedia(
          "(prefers-color-scheme: light)",
        ).matches;
        this.isDark = !prefersLight;
        this.applyTheme();
      }
    });
  }

  applyTheme() {
    if (this.isDark) {
      document.documentElement.classList.remove("light-theme");
      localStorage.setItem("lumina-theme", "dark");
    } else {
      document.documentElement.classList.add("light-theme");
      localStorage.setItem("lumina-theme", "light");
    }
  }

  toggleTheme = () => {
    this.isDark = !this.isDark;
    this.applyTheme();
  };
}
