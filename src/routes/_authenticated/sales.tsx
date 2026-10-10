import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, Search, Banknote, Smartphone, CreditCard, ArrowLeftRight } from "lucide-react";
import { listSales, listProducts, returnSale, exchangeSale, paymentTotals, type Sale, type Product } from "@/backend/inventory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/ui/select";
import { Card } from "@/frontend/ui/card";
import { Button } from "@/frontend/ui/button";
import { Input } from "@/frontend/ui/input";
import { Label } from "@/frontend/ui/label";
import { Badge } from "@/frontend/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/frontend/ui/dialog";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({ meta: [{ title: "Sales & Returns — Style Stock Management" }] }),
  component: SalesPage,
});

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SalesPage() {
  const { data: sales = [], isLoading } = useQuery({ queryKey: ["sales"], queryFn: listSales });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const [search, setSearch] = useState("");
  const [returning, setReturning] = useState<Sale | null>(null);
  const [exchanging, setExchanging] = useState<Sale | null>(null);

  const nameOf = (id: string) => products.find((p) => p.id === id)?.name ?? "Deleted product";
  const totals = paymentTotals(sales);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return sales;
    return sales.filter((s) =>
      [s.customer_name, s.customer_phone, s.invoice_no, nameOf(s.product_id)].some((v) => v.toLowerCase().includes(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, products, search]);

  const cards = [
    { label: "Cash", value: totals.cash ?? 0, icon: Banknote },
    { label: "UPI", value: totals.upi ?? 0, icon: Smartphone },
    { label: "Card", value: totals.card ?? 0, icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Sales & Returns</h1>
        <p className="text-sm text-muted-foreground">Every bill with customer, payment method and returns.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center"><c.icon className="h-5 w-5 text-primary" /></div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label} collected</div>
              <div className="text-xl font-bold tabular-nums">{inr(c.value)}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search customer, phone, bill no, product" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No sales yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="p-3">Date</th><th className="p-3">Bill</th><th className="p-3">Product</th>
                <th className="p-3">Customer</th><th className="p-3">Payment</th>
                <th className="p-3 text-right">Qty</th><th className="p-3 text-right">Amount</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const kept = s.quantity - s.returned_quantity;
                const amount = Number(s.unit_price) * kept * (1 - Number(s.discount) / 100);
                return (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-accent/40">
                    <td className="p-3 whitespace-nowrap">{new Date(s.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                    <td className="p-3 font-mono text-xs">{s.invoice_no || "—"}</td>
                    <td className="p-3">{nameOf(s.product_id)}</td>
                    <td className="p-3">{s.customer_name || "—"}{s.customer_phone && <div className="text-xs text-muted-foreground">{s.customer_phone}</div>}</td>
                    <td className="p-3"><Badge variant="outline" className="uppercase">{s.payment_method}</Badge></td>
                    <td className="p-3 text-right tabular-nums">
                      {kept}{s.returned_quantity > 0 && <div className="text-xs text-destructive">{s.returned_quantity} returned</div>}
                    </td>
                    <td className="p-3 text-right tabular-nums font-semibold">{inr(amount)}</td>
                    <td className="p-3 text-right whitespace-nowrap space-x-2">
                      <Button size="sm" variant="outline" disabled={kept === 0} onClick={() => setExchanging(s)}>
                        <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" /> Exchange
                      </Button>
                      <Button size="sm" variant="outline" disabled={kept === 0} onClick={() => setReturning(s)}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Return
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {returning && <ReturnDialog sale={returning} name={nameOf(returning.product_id)} onClose={() => setReturning(null)} />}
      {exchanging && <ExchangeDialog sale={exchanging} products={products} name={nameOf(exchanging.product_id)} onClose={() => setExchanging(null)} />}
    </div>
  );
}

function ExchangeDialog({ sale, products, name, onClose }: { sale: Sale; products: Product[]; name: string; onClose: () => void }) {
  const qc = useQueryClient();
  const max = sale.quantity - sale.returned_quantity;
  const [qty, setQty] = useState(String(max));
  const [newId, setNewId] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [busy, setBusy] = useState(false);
  const q = Math.max(0, Math.floor(Number(qty) || 0));
  const nq = Math.max(0, Math.floor(Number(newQty) || 0));
  const newP = products.find((p) => p.id === newId);
  const credit = Number(sale.unit_price) * q * (1 - Number(sale.discount) / 100);
  const diff = (newP ? Number(newP.price) * nq : 0) - credit;

  const confirm = async () => {
    if (!newP) return;
    setBusy(true);
    try {
      const d = await exchangeSale(sale, q, newP, nq);
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(d >= 0 ? `Exchanged. Collect ${inr(d)} from customer.` : `Exchanged. Refund ${inr(-d)} to customer.`);
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Exchange {name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Quantity given back (max {max})</Label>
            <Input type="number" min="1" max={max} value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>New product</Label>
            <Select value={newId} onValueChange={setNewId}>
              <SelectTrigger><SelectValue placeholder="Choose product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id} disabled={p.quantity === 0 && p.id !== sale.product_id}>
                    {p.name} — {inr(Number(p.price))} ({p.quantity} in stock)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>New quantity</Label>
            <Input type="number" min="1" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
          </div>
          <div className="rounded-lg border bg-secondary/40 p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Credit for returned</span><span className="tabular-nums">{inr(credit)}</span></div>
            <div className="flex justify-between"><span>New item total</span><span className="tabular-nums">{inr(newP ? Number(newP.price) * nq : 0)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>{diff >= 0 ? "Customer pays" : "Refund to customer"}</span><span className="tabular-nums">{inr(Math.abs(diff))}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={confirm} disabled={busy || !newP || q < 1 || q > max || nq < 1} className="gold-gradient text-primary-foreground font-semibold">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm exchange"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReturnDialog({ sale, name, onClose }: { sale: Sale; name: string; onClose: () => void }) {
  const qc = useQueryClient();
  const max = sale.quantity - sale.returned_quantity;
  const [qty, setQty] = useState(String(max));
  const [busy, setBusy] = useState(false);
  const q = Math.max(0, Math.floor(Number(qty) || 0));
  const refund = Number(sale.unit_price) * q * (1 - Number(sale.discount) / 100);

  const confirm = async () => {
    setBusy(true);
    try {
      const amt = await returnSale(sale, q);
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(`Returned ${q} × ${name}. Refund ${inr(amt)} — stock updated.`);
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Return {name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Quantity to return (max {max})</Label>
            <Input type="number" min="1" max={max} value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="rounded-lg border bg-secondary/40 p-3 flex justify-between text-sm font-semibold">
            <span>Refund to customer</span><span className="tabular-nums">{inr(refund)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Items go back into stock and the sale is removed from profit.</p>
        </div>
        <DialogFooter>
          <Button onClick={confirm} disabled={busy || q < 1 || q > max} className="gold-gradient text-primary-foreground font-semibold">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
