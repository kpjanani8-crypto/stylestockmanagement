import { invoiceCss } from "./styles";
import { invoiceJs } from "./script";

export type InvoiceData = {
  num: string;
  date: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
};

const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function renderInvoiceHtml(d: InvoiceData): string {
  const subtotal = d.unitPrice * d.quantity;
  const discAmt = subtotal * (d.discount / 100);
  const total = subtotal - discAmt;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>Invoice ${d.num}</title>
<style>${invoiceCss}</style></head><body>
<div class="head">
  <div><div class="brand">Style Stock Manager</div><h1>Invoice</h1></div>
  <div style="text-align:right"><div class="muted">Invoice #</div><div style="font-weight:700">${d.num}</div><div class="muted" style="margin-top:8px">${d.date}</div></div>
</div>
<table>
  <thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead>
  <tbody><tr><td>${d.productName}</td><td class="r">${d.quantity}</td><td class="r">${inr(d.unitPrice)}</td><td class="r">${inr(subtotal)}</td></tr></tbody>
</table>
<div class="totals">
  <div class="row"><span>Subtotal</span><span>${inr(subtotal)}</span></div>
  <div class="row"><span>Discount (${d.discount}%)</span><span class="gold">− ${inr(discAmt)}</span></div>
  <div class="row grand"><span>Total</span><span>${inr(total)}</span></div>
</div>
<div class="foot">Thank you for your business · Style Stock Manager</div>
<div class="noprint" style="text-align:center;margin-top:32px"><button onclick="window.print()" style="background:#d4af37;color:#1a1a1a;border:0;padding:12px 28px;font-weight:700;border-radius:6px;cursor:pointer">Print / Save as PDF</button></div>
<script>${invoiceJs}</script>
</body></html>`;
}
