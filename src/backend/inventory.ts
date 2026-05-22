import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { renderMonthlyInvoiceHtml } from "./invoice/monthly";



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


export function downloadMonthlyInvoice(opts: {
  month: number; // 0-11
  year: number;
  sales: Sale[];
  products: Product[];
}) {
  const monthSales = opts.sales.filter((s) => {
    const d = new Date(s.created_at);
    return d.getMonth() === opts.month && d.getFullYear() === opts.year;
  });
  const html = renderMonthlyInvoiceHtml({ ...opts, sales: monthSales });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${opts.year}-${String(opts.month + 1).padStart(2, "0")}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
