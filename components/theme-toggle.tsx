"use client";

import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  function toggleTheme() {
    const html = document.documentElement;

    const isDark = html.classList.contains("dark");
    const newTheme = isDark ? "light" : "dark";

    html.classList.remove("light", "dark");
    html.classList.add(newTheme);
    html.setAttribute("data-theme", newTheme);

    localStorage.setItem("gema-brillante-theme", newTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title="Cambiar modo diurno y nocturno"
      aria-label="Cambiar tema"
      className="theme-toggle"
    >
      <Sun size={20} className="theme-sun" />
      <Moon size={20} className="theme-moon" />
    </button>
  );
}
