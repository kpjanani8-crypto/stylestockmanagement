// Client-side invoice generator. Opens a printable window so the user can
// save as PDF or print. Shop name is stored in localStorage.

const SHOP_KEY = "ssm:shop_name";

export function getShopName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SHOP_KEY) ?? "";
}

export function setShopName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SHOP_KEY, name.trim());
}

export function ensureShopName(): string {
  let name = getShopName();
  if (!name) {
    const entered = window.prompt("Enter your shop name (shown on invoices):", "");
    if (entered && entered.trim()) {
      name = entered.trim();
      setShopName(name);
    } else {
      name = "My Shop";
    }
  }
  return name;
}

export type InvoiceItem = {
  name: string;
  quantity: number;
  unit_price: number;
};

export type InvoiceInput = {
  shopName: string;
  invoiceNo: string;
  items: InvoiceItem[];
  discountPercent: number;
  date?: Date;
};

const money = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function buildInvoiceHtml(inv: InvoiceInput): string {
  const date = inv.date ?? new Date();
  const subtotal = inv.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const discountAmt = subtotal * (inv.discountPercent / 100);
  const total = subtotal - discountAmt;

  const rows = inv.items
    .map(
      (i) => `
      <tr>
        <td>${escapeHtml(i.name)}</td>
        <td class="num">${i.quantity}</td>
        <td class="num">${money(i.unit_price)}</td>
        <td class="num">${money(i.quantity * i.unit_price)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>Invoice ${escapeHtml(inv.invoiceNo)} — ${escapeHtml(inv.shopName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         margin: 0; padding: 40px; color: #111; background: #fff; }
  .wrap { max-width: 720px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start;
          border-bottom: 3px solid #c9a24b; padding-bottom: 16px; margin-bottom: 24px; }
  .shop { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: #1a1a1a; }
  .tag { color: #666; font-size: 12px; margin-top: 4px; letter-spacing: .12em; text-transform: uppercase; }
  .meta { text-align: right; font-size: 13px; color: #333; }
  .meta strong { color: #111; }
  h2 { font-size: 14px; letter-spacing: .18em; color: #888; text-transform: uppercase;
       margin: 24px 0 8px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #eee; }
  th { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #666; font-weight: 600; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { margin-top: 16px; margin-left: auto; width: 280px; font-size: 14px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 8px; }
  .totals .grand { border-top: 2px solid #111; margin-top: 6px; font-weight: 800; font-size: 16px; }
  .foot { margin-top: 40px; text-align: center; color: #888; font-size: 12px; }
  @media print {
    body { padding: 20px; }
    .noprint { display: none; }
  }
  .btn { display: inline-block; margin-right: 8px; padding: 10px 16px; border-radius: 8px;
         background: #c9a24b; color: #fff; font-weight: 600; text-decoration: none; border: 0; cursor: pointer; }
  .btn.secondary { background: #eee; color: #111; }
</style></head>
<body>
  <div class="wrap">
    <div class="noprint" style="text-align:right;margin-bottom:16px;">
      <button class="btn" onclick="window.print()">Save as PDF / Print</button>
      <button class="btn secondary" onclick="window.close()">Close</button>
    </div>
    <div class="head">
      <div>
        <div class="shop">${escapeHtml(inv.shopName)}</div>
        <div class="tag">Tax Invoice</div>
      </div>
      <div class="meta">
        <div><strong>Invoice #</strong> ${escapeHtml(inv.invoiceNo)}</div>
        <div><strong>Date</strong> ${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
        <div><strong>Time</strong> ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
      </div>
    </div>

    <h2>Items</h2>
    <table>
      <thead>
        <tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Amount</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span class="num">${money(subtotal)}</span></div>
      ${inv.discountPercent > 0 ? `<div class="row"><span>Discount (${inv.discountPercent}%)</span><span class="num">− ${money(discountAmt)}</span></div>` : ""}
      <div class="row grand"><span>Total</span><span class="num">${money(total)}</span></div>
    </div>

    <div class="foot">Thank you for shopping with ${escapeHtml(inv.shopName)}.</div>
  </div>
  <script>setTimeout(function(){ try { window.print(); } catch(e){} }, 400);</script>
</body></html>`;
}

export function openInvoiceWindow(inv: InvoiceInput) {
  const html = buildInvoiceHtml(inv);
  const safeShop = inv.shopName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "shop";
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeShop}-${inv.invoiceNo}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function makeInvoiceNo(): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}${m}${day}-${rand}`;
}
