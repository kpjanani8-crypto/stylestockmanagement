export type ThemeMode = "light" | "dark";

const KEY = "ssm:theme";

export function getTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  localStorage.setItem(KEY, mode);
}

/** Inline snippet for <head> so the saved theme applies before first paint. */
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem("ssm:theme")==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;
