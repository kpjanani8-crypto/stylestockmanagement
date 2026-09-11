import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ShopProfile = Tables<"shop_profiles">;

export type ShopProfileInput = {
  shop_name: string;
  address: string;
  phone: string;
  email: string;
  gst_number: string;
  footer_note: string;
};

export const emptyShopProfile: ShopProfileInput = {
  shop_name: "",
  address: "",
  phone: "",
  email: "",
  gst_number: "",
  footer_note: "Thank you for shopping with us!",
};

export async function getShopProfile(): Promise<ShopProfile | null> {
  const { data, error } = await supabase
    .from("shop_profiles")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveShopProfile(input: ShopProfileInput): Promise<ShopProfile> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("shop_profiles")
    .upsert(
      {
        user_id: u.user.id,
        shop_name: input.shop_name.trim(),
        address: input.address.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        gst_number: input.gst_number.trim(),
        footer_note: input.footer_note.trim(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
