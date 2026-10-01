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
import {
  getPaperWidth, setPaperWidth, type PaperWidth,
  BILL_FONTS, getBillFont, setBillFont, billFontCss, type BillFont,
  getBillFontSize, setBillFontSize, type BillFontSize,
} from "@/frontend/lib/printer";
import { printReceipt } from "@/frontend/lib/receipt";
import { makeInvoiceNo } from "@/frontend/lib/invoice";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Style Stock Manager" }] }),
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
  const [font, setFont] = useState<BillFont>("mono");
  const [fontSize, setFontSize] = useState<BillFontSize>("normal");

  useEffect(() => {
    setPaper(getPaperWidth());
    setFont(getBillFont());
    setFontSize(getBillFontSize());
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
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Shop details, billing defaults, theme and account security.
        </p>
      </div>

      <ThemeCard />
      <BillingDefaultsCard />
      <PasswordCard />

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
          <div className="space-y-2">
            <Label>Bill font</Label>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {BILL_FONTS.map((f) => (
                <button key={f.value} type="button" onClick={() => { setFont(f.value); setBillFont(f.value); }}
                  className={"rounded-lg border p-3 text-left transition hover:border-primary " + (font === f.value ? "border-primary bg-accent" : "border-border")}>
                  <div className="text-base" style={{ fontFamily: billFontCss(f.value) }}>₹ 1,250.00</div>
                  <div className="text-xs text-muted-foreground">{f.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Text size</Label>
            <div className="grid gap-3 grid-cols-3 max-w-sm">
              {(["small", "normal", "large"] as const).map((sz) => (
                <button key={sz} type="button" onClick={() => { setFontSize(sz); setBillFontSize(sz); }}
                  className={"rounded-lg border py-2 text-sm font-semibold capitalize transition hover:border-primary " + (fontSize === sz ? "border-primary bg-accent" : "border-border")}>
                  {sz}
                </button>
              ))}
            </div>
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

function ThemeCard() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  useEffect(() => setTheme(getTheme()), []);
  const choose = (m: ThemeMode) => { setTheme(m); applyTheme(m); };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Theme
        </CardTitle>
        <CardDescription>Choose how the dashboard looks on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 max-w-sm">
          {([["light", "Light", Sun], ["dark", "Dark", Moon]] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => choose(value)}
              className={
                "rounded-lg border p-3 text-left transition hover:border-primary flex items-center gap-3 " +
                (theme === value ? "border-primary bg-accent" : "border-border")
              }
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BillingDefaultsCard() {
  const [discount, setDiscount] = useState("0");
  const [lowStock, setLowStock] = useState("5");

  useEffect(() => {
    setDiscount(String(getDefaultDiscount()));
    setLowStock(String(getLowStockThreshold()));
  }, []);

  const save = () => {
    setDefaultDiscount(Number(discount) || 0);
    setLowStockThreshold(Number(lowStock) || 0);
    toast.success("Billing defaults saved.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Percent className="h-4 w-4" /> Billing defaults
        </CardTitle>
        <CardDescription>Pre-filled on every new sale and used for low-stock warnings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="def_discount">Default discount (%)</Label>
            <Input id="def_discount" type="number" min="0" max="100" step="0.5" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="low_stock">Low stock warning at</Label>
            <Input id="low_stock" type="number" min="0" step="1" value={lowStock} onChange={(e) => setLowStock(e.target.value)} />
            <p className="text-xs text-muted-foreground">Products at or below this quantity show a warning badge.</p>
          </div>
        </div>
        <Button onClick={save} className="gold-gradient text-primary-foreground font-semibold">Save defaults</Button>
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const change = async () => {
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error("Password must be 8+ characters with letters and numbers.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password changed successfully.");
      setPassword("");
      setConfirm("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" /> Change password
        </CardTitle>
        <CardDescription>Use at least 8 characters with letters and numbers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new_pw">New password</Label>
            <Input id="new_pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_pw">Confirm password</Label>
            <Input id="confirm_pw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        <Button onClick={change} disabled={saving} variant="outline">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
        </Button>
      </CardContent>
    </Card>
  );
}
