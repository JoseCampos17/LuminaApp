import { onMount } from "svelte";

export class ThemeToggleState {
  theme = $state<"dark" | "light" | "pink">("dark");

  constructor() {
    onMount(() => {
      const saved = localStorage.getItem("lumina-theme");
      if (saved === "light" || saved === "dark" || saved === "pink") {
        this.theme = saved;
        this.applyTheme();
      } else {
        const prefersLight = window.matchMedia(
          "(prefers-color-scheme: light)",
        ).matches;
        this.theme = prefersLight ? "light" : "dark";
        this.applyTheme();
      }
    });
  }

  applyTheme() {
    document.documentElement.classList.remove("light-theme", "pink-theme");

    if (this.theme === "light") {
      document.documentElement.classList.add("light-theme");
    } else if (this.theme === "pink") {
      document.documentElement.classList.add("pink-theme");
    }

    localStorage.setItem("lumina-theme", this.theme);
  }

  toggleTheme = () => {
    if (this.theme === "dark") {
      this.theme = "light";
    } else if (this.theme === "light") {
      this.theme = "pink";
    } else {
      this.theme = "dark";
    }
    this.applyTheme();
  };
}
