import { invoiceCss } from "./styles";
import { invoiceJs } from "./script";
import type { Product, Sale } from "../inventory";

const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function renderMonthlyInvoiceHtml(opts: {
  month: number; // 0-11
  year: number;
  sales: Sale[];
  products: Product[];
}): string {
  const { month, year, sales, products } = opts;
  const productOf = (id: string) => products.find((p) => p.id === id);

  const rows = sales.map((s) => {
    const p = productOf(s.product_id);
    const subtotal = Number(s.unit_price) * s.quantity;
    const total = subtotal * (1 - Number(s.discount) / 100);
    return { s, name: p?.name ?? "(deleted product)", subtotal, total };
  });

  const subtotal = rows.reduce((a, r) => a + r.subtotal, 0);
  const total = rows.reduce((a, r) => a + r.total, 0);
  const discount = subtotal - total;
  const label = `${MONTH_NAMES[month]} ${year}`;
  const num = `${year}${String(month + 1).padStart(2, "0")}`;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>Monthly Invoice ${label}</title>
<style>${invoiceCss}</style></head><body>
<div class="head">
  <div><div class="brand">Style Stock Manager</div><h1>Monthly Invoice</h1></div>
  <div style="text-align:right"><div class="muted">Period</div><div style="font-weight:700">${label}</div><div class="muted" style="margin-top:8px">Invoice #${num}</div></div>
</div>
${rows.length === 0 ? `<p style="text-align:center;color:#999;padding:48px 0">No sales recorded for ${label}.</p>` : `
<table>
  <thead><tr><th>Date</th><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Disc</th><th class="r">Amount</th></tr></thead>
  <tbody>
    ${rows.map((r) => `<tr>
      <td>${new Date(r.s.created_at).toLocaleDateString("en-IN")}</td>
      <td>${r.name}</td>
      <td class="r">${r.s.quantity}</td>
      <td class="r">${inr(Number(r.s.unit_price))}</td>
      <td class="r">${Number(r.s.discount)}%</td>
      <td class="r">${inr(r.total)}</td>
    </tr>`).join("")}
  </tbody>
</table>
<div class="totals">
  <div class="row"><span>Subtotal</span><span>${inr(subtotal)}</span></div>
  <div class="row"><span>Total Discount</span><span class="gold">− ${inr(discount)}</span></div>
  <div class="row grand"><span>Grand Total</span><span>${inr(total)}</span></div>
</div>`}
<div class="foot">Thank you for your business · Style Stock Manager</div>
<div class="noprint" style="text-align:center;margin-top:32px"><button onclick="window.print()" style="background:#d4af37;color:#1a1a1a;border:0;padding:12px 28px;font-weight:700;border-radius:6px;cursor:pointer">Print / Save as PDF</button></div>
<script>${invoiceJs}</script>
</body></html>`;
}
