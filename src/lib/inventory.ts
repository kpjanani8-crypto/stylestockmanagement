import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type Sale = Tables<"sales">;

export const COST_RATIO = 0.7; // cost = 70% of price

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

export async function createProduct(input: { name: string; price: number; quantity: number; image_url?: string | null; }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { error } = await supabase.from("products").insert({
    user_id: u.user.id,
    name: input.name,
    price: input.price,
    quantity: input.quantity,
    image_url: input.image_url ?? null,
  });
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function sellProduct(product: Product, qty: number) {
  if (qty <= 0) throw new Error("Quantity must be positive");
  if (qty > product.quantity) throw new Error("Not enough stock");
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");

  const { error: upErr } = await supabase
    .from("products")
    .update({ quantity: product.quantity - qty, sold: product.sold + qty })
    .eq("id", product.id);
  if (upErr) throw upErr;

  const { error: sErr } = await supabase.from("sales").insert({
    user_id: u.user.id,
    product_id: product.id,
    quantity: qty,
    unit_price: product.price,
  });
  if (sErr) throw sErr;
}

export function computeSummary(products: Product[]) {
  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + p.quantity, 0);
  const totalSold = products.reduce((s, p) => s + p.sold, 0);
  const revenue = products.reduce((s, p) => s + Number(p.price) * p.sold, 0);
  const cost = revenue * COST_RATIO;
  const net = revenue - cost;
  return {
    totalProducts,
    totalStock,
    totalSold,
    revenue,
    profit: net >= 0 ? net : 0,
    loss: net < 0 ? -net : 0,
  };
}
