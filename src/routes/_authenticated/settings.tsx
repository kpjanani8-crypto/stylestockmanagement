import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Printer, Store, KeyRound, Sun, Moon, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getTheme, applyTheme, type ThemeMode } from "@/frontend/lib/theme";
import {
  getDefaultDiscount, setDefaultDiscount,
  getLowStockThreshold, setLowStockThreshold,
} from "@/frontend/lib/billing-defaults";
import {
  getShopProfile,
  saveShopProfile,
  emptyShopProfile,
  type ShopProfileInput,
} from "@/backend/shop-profile";
import { Button } from "@/frontend/ui/button";
import { Input } from "@/frontend/ui/input";
import { Label } from "@/frontend/ui/label";
import { Textarea } from "@/frontend/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/ui/card";
import { getPaperWidth, setPaperWidth, type PaperWidth } from "@/frontend/lib/printer";
import { printReceipt } from "@/frontend/lib/receipt";
import { makeInvoiceNo } from "@/frontend/lib/invoice";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Shop profile — Style Stock Manager" }] }),
  component: SettingsPage,
});

const PAPERS: { value: PaperWidth; label: string; hint: string }[] = [
  { value: "58mm", label: "58 mm roll", hint: "Small handheld billing machine" },
  { value: "80mm", label: "80 mm roll", hint: "Standard counter billing machine" },
  { value: "A4", label: "A4 sheet", hint: "Normal office printer" },
];

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["shop-profile"], queryFn: getShopProfile });
  const [form, setForm] = useState<ShopProfileInput>(emptyShopProfile);
  const [paper, setPaper] = useState<PaperWidth>("80mm");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPaper(getPaperWidth());
  }, []);

  useEffect(() => {
    if (data) {
      setForm({
        shop_name: data.shop_name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        gst_number: data.gst_number,
        footer_note: data.footer_note || emptyShopProfile.footer_note,
      });
    }
  }, [data]);

  const set = (k: keyof ShopProfileInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.shop_name.trim()) {
      toast.error("Please enter your shop name.");
      return;
    }
    setSaving(true);
    try {
      await saveShopProfile(form);
      qc.invalidateQueries({ queryKey: ["shop-profile"] });
      toast.success("Shop details saved — they'll appear on every bill.");
    } catch (err: any) {
      toast.error(err.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const choosePaper = (w: PaperWidth) => {
    setPaper(w);
    setPaperWidth(w);
  };

  const testPrint = () => {
    printReceipt(
      {
        shopName: form.shop_name || "My Shop",
        shopAddress: form.address,
        shopPhone: form.phone,
        shopEmail: form.email,
        gstNumber: form.gst_number,
        footerNote: form.footer_note,
        invoiceNo: makeInvoiceNo(),
        discountPercent: 0,
        items: [{ name: "Test item", quantity: 1, unit_price: 100 }],
      },
      paper,
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Shop profile</h1>
        <p className="text-sm text-muted-foreground">
          These details are printed on every bill and invoice.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4" /> Shop details
          </CardTitle>
          <CardDescription>Name, address and contact shown at the top of each bill.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="shop_name">Shop name</Label>
                <Input id="shop_name" value={form.shop_name} onChange={set("shop_name")} placeholder="NSF Dress Shop" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" rows={3} value={form.address} onChange={set("address")} placeholder="12 Main Road, Coimbatore, TN 641001" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="hello@myshop.com" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gst_number">GST number (optional)</Label>
                  <Input id="gst_number" value={form.gst_number} onChange={set("gst_number")} placeholder="33ABCDE1234F1Z5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer_note">Bill footer message</Label>
                  <Input id="footer_note" value={form.footer_note} onChange={set("footer_note")} placeholder="Thank you, visit again!" />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="gold-gradient text-primary-foreground font-semibold">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save shop details"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Printer className="h-4 w-4" /> Billing machine
          </CardTitle>
          <CardDescription>
            Pair your billing machine with this phone or laptop (Bluetooth, USB or Wi-Fi) once. Then choose the
            paper size below — every sale opens the print box, where you pick that printer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {PAPERS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => choosePaper(p.value)}
                className={
                  "rounded-lg border p-3 text-left transition hover:border-primary " +
                  (paper === p.value ? "border-primary bg-accent" : "border-border")
                }
              >
                <div className="text-sm font-semibold">{p.label}</div>
                <div className="text-xs text-muted-foreground">{p.hint}</div>
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={testPrint}>
            <Printer className="h-4 w-4 mr-2" /> Print a test bill
          </Button>
          <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-1">
            <li>Turn on the billing machine and pair it with this phone or laptop.</li>
            <li>Pick the paper size above and tap "Print a test bill".</li>
            <li>In the print box choose your billing machine, then print.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
