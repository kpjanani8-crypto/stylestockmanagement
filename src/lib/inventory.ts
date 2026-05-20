import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type Sale = Tables<"sales">;

export const COST_RATIO = 0.7; // fallback when no cost_price is set on a product

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createProduct(input: { name: string; price: number; cost_price: number; quantity: number; image_url?: string | null; }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { error } = await supabase.from("products").insert({
    user_id: u.user.id,
    name: input.name,
    price: input.price,
    cost_price: input.cost_price,
    quantity: input.quantity,
    image_url: input.image_url ?? null,
  } as any);
  if (error) throw error;
}

export async function updateProduct(id: string, patch: { name?: string; price?: number; cost_price?: number; quantity?: number; image_url?: string | null; }) {
  const { error } = await supabase.from("products").update(patch as any).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function sellProduct(product: Product, qty: number, discount = 0) {
  if (qty <= 0) throw new Error("Quantity must be positive");
  if (qty > product.quantity) throw new Error("Not enough stock");
  if (discount < 0 || discount > 100) throw new Error("Discount must be 0-100%");
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");

  const { error: upErr } = await supabase
    .from("products")
    .update({ quantity: product.quantity - qty, sold: product.sold + qty })
    .eq("id", product.id);
  if (upErr) throw upErr;

  const { data: sale, error: sErr } = await supabase.from("sales").insert({
    user_id: u.user.id,
    product_id: product.id,
    quantity: qty,
    unit_price: product.price,
    discount,
  }).select().single();
  if (sErr) throw sErr;
  return sale as Sale;
}

export function downloadInvoice(opts: {
  sale: { id: string; created_at: string; quantity: number; unit_price: number; discount: number };
  product: { name: string };
}) {
  const { sale, product } = opts;
  const subtotal = Number(sale.unit_price) * sale.quantity;
  const discAmt = subtotal * (Number(sale.discount) / 100);
  const total = subtotal - discAmt;
  const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const date = new Date(sale.created_at).toLocaleString("en-IN");
  const num = sale.id.slice(0, 8).toUpperCase();

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Invoice ${num}</title>
<style>
  *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  body{margin:0;padding:48px;color:#1a1a1a;background:#fff}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #d4af37;padding-bottom:24px;margin-bottom:32px}
  h1{margin:0;font-size:32px;letter-spacing:-0.5px}
  .brand{color:#d4af37;font-weight:700;font-size:14px;letter-spacing:2px;text-transform:uppercase}
  .muted{color:#666;font-size:13px}
  table{width:100%;border-collapse:collapse;margin:24px 0}
  th,td{padding:14px;text-align:left;border-bottom:1px solid #eee}
  th{background:#fafafa;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#666}
  td.r,th.r{text-align:right}
  .totals{margin-left:auto;width:280px;font-size:14px}
  .totals .row{display:flex;justify-content:space-between;padding:8px 0}
  .totals .grand{border-top:2px solid #1a1a1a;margin-top:8px;padding-top:14px;font-size:18px;font-weight:700}
  .gold{color:#d4af37}
  .foot{margin-top:48px;text-align:center;color:#999;font-size:12px}
  @media print{body{padding:24px}.noprint{display:none}}
</style></head><body>
<div class="head">
  <div><div class="brand">Style Stock Manager</div><h1>Invoice</h1></div>
  <div style="text-align:right"><div class="muted">Invoice #</div><div style="font-weight:700">${num}</div><div class="muted" style="margin-top:8px">${date}</div></div>
</div>
<table>
  <thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead>
  <tbody><tr><td>${product.name}</td><td class="r">${sale.quantity}</td><td class="r">${inr(Number(sale.unit_price))}</td><td class="r">${inr(subtotal)}</td></tr></tbody>
</table>
<div class="totals">
  <div class="row"><span>Subtotal</span><span>${inr(subtotal)}</span></div>
  <div class="row"><span>Discount (${Number(sale.discount)}%)</span><span class="gold">− ${inr(discAmt)}</span></div>
  <div class="row grand"><span>Total</span><span>${inr(total)}</span></div>
</div>
<div class="foot">Thank you for your business · Style Stock Manager</div>
<div class="noprint" style="text-align:center;margin-top:32px"><button onclick="window.print()" style="background:#d4af37;color:#1a1a1a;border:0;padding:12px 28px;font-weight:700;border-radius:6px;cursor:pointer">Print / Save as PDF</button></div>
<script>setTimeout(()=>window.print(),400)</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) { throw new Error("Popup blocked — allow popups to download invoice"); }
  w.document.write(html);
  w.document.close();
}

export function computeSummary(products: Product[], sales: Sale[] = []) {
  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + p.quantity, 0);
  const totalSold = sales.reduce((s, x) => s + x.quantity, 0);

  // Build a quick lookup of cost_price per product (fallback to estimate if 0/missing)
  const costOf = (productId: string, unitPrice: number) => {
    const p = products.find((x) => x.id === productId) as (Product & { cost_price?: number }) | undefined;
    const cp = Number(p?.cost_price ?? 0);
    return cp > 0 ? cp : unitPrice * COST_RATIO;
  };

  let revenue = 0;   // net amount actually collected
  let cost = 0;      // real cost of goods sold
  let loss = 0;      // sales that closed below cost (selling under cost)
  let profit = 0;    // sales that closed above cost
  for (const sale of sales) {
    const unit = Number(sale.unit_price);
    const gross = unit * sale.quantity;
    const net = gross * (1 - Number(sale.discount) / 100);
    const itemCost = costOf(sale.product_id, unit) * sale.quantity;
    const margin = net - itemCost;
    revenue += net;
    cost += itemCost;
    if (margin >= 0) profit += margin;
    else loss += -margin;
  }

  return { totalProducts, totalStock, totalSold, revenue, cost, profit, loss };
}
