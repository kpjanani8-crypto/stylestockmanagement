import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { listProducts, listSales, computeSummary, downloadMonthlyInvoice, COST_RATIO } from "@/backend/inventory";
import { Card } from "@/frontend/ui/card";
import { Button } from "@/frontend/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/ui/select";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Style Stock Manager" }] }),
  component: AnalyticsPage,
});

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const COLORS = ["oklch(0.65 0.16 150)", "oklch(0.65 0.2 25)", "oklch(0.78 0.14 82)", "oklch(0.6 0.18 250)"];


function AnalyticsPage() {
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: listSales });

  const productSales = products
    .filter((p) => p.sold > 0)
    .map((p) => ({ name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name, sold: p.sold, revenue: Number(p.price) * p.sold }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 8);

  const summary = computeSummary(products, sales);
  const pieData = [
    { name: "Profit", value: summary.profit },
    { name: "Loss", value: summary.loss },
  ].filter((d) => d.value > 0);

  const monthly = MONTHS.map((m, i) => ({ month: m, revenue: 0, profit: 0 }));
  for (const s of sales) {
    const d = new Date(s.created_at);
    const m = d.getMonth();
    const rev = Number(s.unit_price) * s.quantity;
    monthly[m].revenue += rev;
    monthly[m].profit += rev * (1 - COST_RATIO);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Sales trends, profit breakdown & monthly performance</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold font-display mb-4">Product-wise Sales</h2>
          {productSales.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={productSales}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="sold" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold font-display mb-4">Profit vs Loss</h2>
          {pieData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold font-display mb-4">Monthly Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
              contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="profit" stroke="oklch(0.65 0.16 150)" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">
      No sales data yet — record some sales to see charts.
    </div>
  );
}
