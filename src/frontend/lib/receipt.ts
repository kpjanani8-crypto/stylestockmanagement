// Receipt (thermal / billing machine) printing.
// Renders a narrow roll-width bill and sends it to the device print dialog,
// so any printer paired with the phone or laptop can print it.

import type { InvoiceInput } from "./invoice";

export type PaperWidth = "58mm" | "80mm" | "A4";

const money = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildReceiptHtml(inv: InvoiceInput, width: PaperWidth = "80mm"): string {
  const date = inv.date ?? new Date();
  const subtotal = inv.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const discountAmt = subtotal * (inv.discountPercent / 100);
  const total = subtotal - discountAmt;
  const qtyTotal = inv.items.reduce((s, i) => s + i.quantity, 0);

  const paper = width === "A4" ? "210mm" : width;
  const bodyWidth = width === "A4" ? "180mm" : width === "80mm" ? "72mm" : "50mm";

  const rows = inv.items
    .map(
      (i) => `
      <tr><td colspan="3" class="item">${escapeHtml(i.name)}</td></tr>
      <tr>
        <td class="sub">${i.quantity} × ${money(i.unit_price)}</td>
        <td></td>
        <td class="num">${money(i.quantity * i.unit_price)}</td>
      </tr>`,
    )
    .join("");

  const line = (label: string, value: string, cls = "") =>
    `<div class="row ${cls}"><span>${label}</span><span>${value}</span></div>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>Bill ${escapeHtml(inv.invoiceNo)}</title>
<style>
  @page { size: ${paper} auto; margin: 3mm; }
  * { box-sizing: border-box; }
  body { width: ${bodyWidth}; margin: 0 auto; padding: 0;
         font-family: "Courier New", ui-monospace, monospace; color: #000; background: #fff;
         font-size: ${width === "58mm" ? "11px" : "12px"}; line-height: 1.45; }
  .center { text-align: center; }
  .shop { font-size: ${width === "58mm" ? "14px" : "16px"}; font-weight: 700; letter-spacing: .04em; }
  .muted { font-size: 10px; }
  hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 0; vertical-align: top; }
  .item { font-weight: 700; padding-top: 4px; }
  .sub { font-size: 10px; }
  .num { text-align: right; white-space: nowrap; }
  .row { display: flex; justify-content: space-between; }
  .grand { font-weight: 700; font-size: ${width === "58mm" ? "13px" : "15px"}; margin-top: 4px; }
</style></head>
<body>
  <div class="center">
    <div class="shop">${escapeHtml(inv.shopName || "My Shop")}</div>
    ${inv.shopAddress ? `<div class="muted">${escapeHtml(inv.shopAddress).replace(/\n/g, "<br/>")}</div>` : ""}
    ${inv.shopPhone ? `<div class="muted">Ph: ${escapeHtml(inv.shopPhone)}</div>` : ""}
    ${inv.shopEmail ? `<div class="muted">${escapeHtml(inv.shopEmail)}</div>` : ""}
    ${inv.gstNumber ? `<div class="muted">GSTIN: ${escapeHtml(inv.gstNumber)}</div>` : ""}
  </div>
  <hr/>
  <div class="row muted"><span>Bill: ${escapeHtml(inv.invoiceNo)}</span></div>
  <div class="row muted">
    <span>${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
    <span>${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
  </div>
  ${inv.customerName ? `<div class="muted">Customer: ${escapeHtml(inv.customerName)}</div>` : ""}
  ${inv.customerPhone ? `<div class="muted">Ph: ${escapeHtml(inv.customerPhone)}</div>` : ""}
  <hr/>
  <table>${rows}</table>
  <hr/>
  ${line("Items", String(qtyTotal))}
  ${line("Subtotal", money(subtotal))}
  ${inv.discountPercent > 0 ? line(`Discount (${inv.discountPercent}%)`, "- " + money(discountAmt)) : ""}
  ${line("TOTAL", "Rs " + money(total), "grand")}
  ${inv.paymentMethod ? line("Paid by", escapeHtml(inv.paymentMethod.toUpperCase())) : ""}
  <hr/>
  <div class="center muted">${escapeHtml(inv.footerNote || "Thank you for shopping with us!")}</div>
  <div class="center muted">&nbsp;</div>
</body></html>`;
}

/** Sends HTML to the device print dialog via a hidden iframe (no popup blocker). */
export function printHtml(html: string) {
  if (typeof document === "undefined") return;
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const run = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      /* ignore */
    }
    setTimeout(() => frame.remove(), 60_000);
  };
  if (doc.readyState === "complete") setTimeout(run, 250);
  else frame.onload = () => setTimeout(run, 250);
}

export function printReceipt(inv: InvoiceInput, width: PaperWidth = "80mm") {
  printHtml(buildReceiptHtml(inv, width));
}
