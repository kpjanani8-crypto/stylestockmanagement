import type { PaperWidth } from "./receipt";

export type { PaperWidth };

const KEY = "ssm:paper_width";

export function getPaperWidth(): PaperWidth {
  if (typeof window === "undefined") return "80mm";
  const v = window.localStorage.getItem(KEY);
  return v === "58mm" || v === "A4" || v === "80mm" ? v : "80mm";
}

export function setPaperWidth(w: PaperWidth) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, w);
}
