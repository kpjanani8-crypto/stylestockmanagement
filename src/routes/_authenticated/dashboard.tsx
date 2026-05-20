import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Package, ShoppingCart, IndianRupee, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { listProducts, listSales, computeSummary } from "@/lib/inventory";
import { KpiCard } from "@/components/kpi-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Style Stock Manager" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"], queryFn: listProducts,
  });
  const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: listSales });
  const s = computeSummary(products, sales);
  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= 5);
  const outOfStock = products.filter((p) => p.quantity === 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold font-display">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time overview of your store performance</p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 py-1.5 px-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live data
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Total Products" value={s.totalProducts} icon={Package} accent="blue" />
        <KpiCard label="Total Stock" value={s.totalStock} icon={Boxes} accent="violet" />
        <KpiCard label="Total Sold" value={s.totalSold} icon={ShoppingCart} accent="gold" />
        <KpiCard label="Revenue" value={s.revenue} prefix="₹" decimals={0} icon={IndianRupee} accent="green" />
        <KpiCard label="Profit" value={s.profit} prefix="₹" decimals={0} icon={TrendingUp} accent="green" hint="revenue − cost" />
        <KpiCard label="Loss" value={s.loss} prefix="₹" decimals={0} icon={TrendingDown} accent="red" hint="sold below cost" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-display">Low Stock Alerts</h2>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : lowStock.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">All products well stocked 🎉</div>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                  <span className="font-medium">{p.name}</span>
                  <Badge className="bg-warning text-warning-foreground">{p.quantity} left</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-display">Top Sellers</h2>
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : products.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No products yet — add some on the Products page.
            </div>
          ) : (
            <ul className="space-y-2">
              {[...products].sort((a, b) => b.sold - a.sold).slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="font-medium truncate">{p.name}</span>
                  <span className="text-sm tabular-nums">
                    <span className="text-muted-foreground">sold</span> <span className="font-semibold">{p.sold}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {outOfStock.length > 0 && (
        <Card className="p-4 border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-medium">{outOfStock.length} product(s) out of stock</span>
            <span className="text-muted-foreground">— restock soon</span>
          </div>
        </Card>
      )}
    </div>
  );
}
