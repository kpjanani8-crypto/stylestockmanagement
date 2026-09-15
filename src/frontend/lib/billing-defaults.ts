const DISCOUNT_KEY = "ssm:default_discount";
const LOW_STOCK_KEY = "ssm:low_stock_threshold";

export function getDefaultDiscount(): number {
  if (typeof window === "undefined") return 0;
  const v = Number(localStorage.getItem(DISCOUNT_KEY));
  return Number.isFinite(v) && v >= 0 && v <= 100 ? v : 0;
}

export function setDefaultDiscount(v: number) {
  localStorage.setItem(DISCOUNT_KEY, String(Math.min(100, Math.max(0, v))));
}

export function getLowStockThreshold(): number {
  if (typeof window === "undefined") return 5;
  const v = Number(localStorage.getItem(LOW_STOCK_KEY));
  return Number.isFinite(v) && v >= 0 ? v : 5;
}

export function setLowStockThreshold(v: number) {
  localStorage.setItem(LOW_STOCK_KEY, String(Math.max(0, Math.round(v))));
}
