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

export const BILL_FONTS = [
  { value: "mono", label: "Typewriter", css: '"Courier New", ui-monospace, monospace' },
  { value: "sans", label: "Clean", css: 'Arial, "Helvetica Neue", sans-serif' },
  { value: "serif", label: "Classic", css: 'Georgia, "Times New Roman", serif' },
  { value: "bold", label: "Bold", css: '"Arial Black", Arial, sans-serif' },
] as const;
export type BillFont = (typeof BILL_FONTS)[number]["value"];
export type BillFontSize = "small" | "normal" | "large";

export function getBillFont(): BillFont {
  if (typeof window === "undefined") return "mono";
  const v = window.localStorage.getItem("ssm:bill_font");
  return (BILL_FONTS.find((f) => f.value === v)?.value ?? "mono") as BillFont;
}
export function setBillFont(f: BillFont) { window.localStorage.setItem("ssm:bill_font", f); }
export function billFontCss(f: BillFont = getBillFont()) {
  return BILL_FONTS.find((x) => x.value === f)?.css ?? BILL_FONTS[0].css;
}
export function getBillFontSize(): BillFontSize {
  if (typeof window === "undefined") return "normal";
  const v = window.localStorage.getItem("ssm:bill_font_size");
  return v === "small" || v === "large" ? v : "normal";
}
export function setBillFontSize(s: BillFontSize) { window.localStorage.setItem("ssm:bill_font_size", s); }
export function billFontScale(s: BillFontSize = getBillFontSize()) {
  return s === "small" ? 0.9 : s === "large" ? 1.15 : 1;
}
