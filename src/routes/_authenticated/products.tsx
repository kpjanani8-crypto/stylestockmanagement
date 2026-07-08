import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Trash2, ShoppingCart, Search, ImageIcon, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { listProducts, createProduct, updateProduct, deleteProduct, sellProduct, type Product } from "@/backend/inventory";
import { ensureShopName, makeInvoiceNo, openInvoiceWindow } from "@/frontend/lib/invoice";
import { Card } from "@/frontend/ui/card";
import { Button } from "@/frontend/ui/button";
import { Input } from "@/frontend/ui/input";
import { Label } from "@/frontend/ui/label";
import { Badge } from "@/frontend/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/frontend/ui/dialog";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({ meta: [{ title: "Products — Style Stock Manager" }] }),
  component: ProductsPage,
});

const productSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  price: z.number().positive("Selling price must be > 0"),
  cost_price: z.number().min(0, "Cost price must be ≥ 0"),
  quantity: z.number().int().min(0),
});

function ProductsPage() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const delMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Product deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold font-display">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your inventory, add stock, record sales</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gold-gradient text-primary-foreground font-semibold">
              <Plus className="h-4 w-4 mr-2" /> Add product
            </Button>
          </DialogTrigger>
          <AddProductDialog onDone={() => setOpen(false)} />
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-9" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Image</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold text-right">Cost</th>
                <th className="px-4 py-3 font-semibold text-right">Price</th>
                <th className="px-4 py-3 font-semibold text-right">Stock</th>
                <th className="px-4 py-3 font-semibold text-right">Sold</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  {products.length === 0 ? "No products yet. Click Add product to get started." : "No matches."}
                </td></tr>
              ) : filtered.map((p) => {
                const cost = Number((p as any).cost_price ?? 0);
                return (
                <tr key={p.id} className="border-t hover:bg-secondary/30 transition">
                  <td className="px-4 py-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-lg object-cover border" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {cost > 0 ? `₹${cost.toLocaleString("en-IN")}` : <span className="text-destructive text-xs">set cost</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">₹{Number(p.price).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">
                    <StockBadge qty={p.quantity} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.sold}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <SellButton product={p} />
                      <EditButton product={p} />
                      <Button size="icon" variant="ghost" onClick={() => delMut.mutate(p.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) return <Badge variant="destructive">Out</Badge>;
  if (qty <= 5) return <Badge className="bg-warning text-warning-foreground">{qty} left</Badge>;
  return <Badge variant="secondary" className="tabular-nums">{qty}</Badge>;
}

function AddProductDialog({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be < 2MB"); return; }
    const r = new FileReader();
    r.onload = () => setImageUrl(r.result as string);
    r.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = productSchema.safeParse({
      name, price: Number(price), cost_price: Number(costPrice), quantity: Number(quantity),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (parsed.data.cost_price > parsed.data.price) {
      toast.error("Cost price is higher than selling price — you'll lose money on every sale.");
    }
    setSubmitting(true);
    try {
      await createProduct({ ...parsed.data, image_url: imageUrl });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product added");
      setName(""); setPrice(""); setCostPrice(""); setQuantity(""); setImageUrl(null);
      onDone();
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Add new product</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Silk evening gown" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Cost price (₹)</Label>
            <Input type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="1500" />
          </div>
          <div className="space-y-2">
            <Label>Selling price (₹)</Label>
            <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2499" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="20" />
        </div>
        <div className="space-y-2">
          <Label>Image</Label>
          <Input type="file" accept="image/*" onChange={handleImage} />
          {imageUrl && <img src={imageUrl} alt="" className="h-24 w-24 rounded-lg object-cover border" />}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting} className="gold-gradient text-primary-foreground font-semibold">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add product"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function SellButton({ product }: { product: Product }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [busy, setBusy] = useState(false);

  const q = Math.max(0, Number(qty) || 0);
  const d = Math.min(100, Math.max(0, Number(discount) || 0));
  const subtotal = q * Number(product.price);
  const total = subtotal * (1 - d / 100);

  const handleSell = async () => {
    setBusy(true);
    try {
      await sellProduct(product, q, d);
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast.success(`Sold ${q} × ${product.name}`);
      setOpen(false);
      setQty("1"); setDiscount("0");

    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={product.quantity === 0}>
          <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Sell
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Sell {product.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">Available: <span className="font-semibold text-foreground">{product.quantity}</span> · Price: <span className="font-semibold text-foreground">₹{Number(product.price).toLocaleString("en-IN")}</span></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="1" max={product.quantity} value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input type="number" min="0" max="100" step="0.5" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
          </div>
          <div className="rounded-lg border bg-secondary/40 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="tabular-nums text-primary">− ₹{(subtotal - total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between border-t pt-1.5 font-semibold"><span>Total</span><span className="tabular-nums">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSell} disabled={busy || q < 1} className="gold-gradient text-primary-foreground font-semibold">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm sale"}
          </Button>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditButton({ product }: { product: Product }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [costPrice, setCostPrice] = useState(String((product as any).cost_price ?? ""));
  const [quantity, setQuantity] = useState(String(product.quantity));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const p = Number(price), c = Number(costPrice), q = Number(quantity);
    if (!name.trim()) { toast.error("Name required"); return; }
    if (!(p > 0)) { toast.error("Selling price must be > 0"); return; }
    if (c < 0) { toast.error("Cost price must be ≥ 0"); return; }
    if (!Number.isInteger(q) || q < 0) { toast.error("Quantity invalid"); return; }
    setBusy(true);
    try {
      await updateProduct(product.id, { name: name.trim(), price: p, cost_price: c, quantity: q });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated");
      setOpen(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit product</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cost price (₹)</Label>
              <Input type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Selling price (₹)</Label>
              <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Stock quantity</Label>
            <Input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={busy} className="gold-gradient text-primary-foreground font-semibold">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
