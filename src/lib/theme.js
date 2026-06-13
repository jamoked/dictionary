// theme.js — THEME PREFERENCES LAYER
// The one place (besides storage.js) that touches localStorage. It owns the two
// theme keys and the matching changes to <html> (the `dark` class and the
// `data-theme` attribute). Keeping it isolated means the rest of the app reads
// and writes theme prefs through these functions, just like card data goes
// through storage.js.
//
// Note: index.html runs a tiny copy of this logic inline before first paint so
// the page never flashes the wrong colors. These functions take over once React
// mounts and whenever the user changes a setting.

const MODE_KEY = "theme"; // "light" | "dark"
const COLOR_KEY = "color-theme"; // "obsidian" | "slate"

// Reads the saved light/dark mode, falling back to the OS preference.
export function getInitialMode() {
  const saved = localStorage.getItem(MODE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Reads the saved color theme, migrating the old "default" name to "slate".
export function getInitialColorTheme() {
  const saved = localStorage.getItem(COLOR_KEY);
  if (saved === "default") return "slate";
  return saved || "obsidian";
}

// Applies and persists the light/dark mode.
export function applyMode(mode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  localStorage.setItem(MODE_KEY, mode);
}

// Applies and persists the color theme.
export function applyColorTheme(name) {
  document.documentElement.setAttribute("data-theme", name);
  localStorage.setItem(COLOR_KEY, name);
}
