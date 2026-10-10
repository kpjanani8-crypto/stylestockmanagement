import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, FileSpreadsheet, Loader2 } from "lucide-react";
import { listProducts, listSales } from "@/backend/inventory";
import { buildReport, downloadReportExcel, periodLabel, shiftRef, type Period } from "@/backend/reports";
import { Card } from "@/frontend/ui/card";
import { Button } from "@/frontend/ui/button";
import { cn } from "@/frontend/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — Style Stock Management" }] }),
  component: ReportsPage,
});

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PERIODS: { v: Period; l: string }[] = [
  { v: "day", l: "Daily" }, { v: "week", l: "Weekly" }, { v: "month", l: "Monthly" }, { v: "year", l: "Yearly" },
];

function ReportsPage() {
  const { data: products = [], isLoading: lp } = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const { data: sales = [], isLoading: ls } = useQuery({ queryKey: ["sales"], queryFn: listSales });
  const [period, setPeriod] = useState<Period>("month");
  const [ref, setRef] = useState(() => new Date());
  const [busy, setBusy] = useState(false);

  const report = useMemo(() => buildReport(products, sales, period, ref), [products, sales, period, ref]);
  const label = periodLabel(period, ref);

  const download = async () => {
    setBusy(true);
    try { await downloadReportExcel({ label, products, report }); toast.success("Excel report downloaded"); }
    catch (e: any) { toast.error(e.message ?? "Could not create Excel file"); }
    finally { setBusy(false); }
  };

  const kpis = [
    { l: "Bills", v: String(report.bills) },
    { l: "Items sold", v: String(report.totals.sold) },
    { l: "Revenue", v: inr(report.totals.revenue) },
    { l: "Profit", v: inr(report.totals.profit), bad: report.totals.profit < 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Sales and profit for any day, week, month or year.</p>
        </div>
        <Button onClick={download} disabled={busy || report.bills === 0} className="gold-gradient text-primary-foreground font-semibold">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileSpreadsheet className="h-4 w-4 mr-2" /> Download Excel</>}
        </Button>
      </div>

      <Card className="p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border p-1">
          {PERIODS.map((p) => (
            <button key={p.v} type="button" onClick={() => setPeriod(p.v)}
              className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition",
                period === p.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {p.l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => setRef(shiftRef(period, ref, -1))} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
          <div className="min-w-[190px] text-center font-semibold text-sm">{label}</div>
          <Button size="icon" variant="outline" onClick={() => setRef(shiftRef(period, ref, 1))} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setRef(new Date())}>Today</Button>
        </div>
      </Card>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.l} className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.l}</div>
            <div className={cn("text-2xl font-bold tabular-nums mt-1", k.bad && "text-destructive")}>{k.v}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <div className="px-5 pt-5 pb-3 font-semibold font-display">Profit by product</div>
        {lp || ls ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : report.rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No sales in {label}.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-y">
              <tr>
                <th className="p-3">Product</th><th className="p-3 text-right">Sold</th><th className="p-3 text-right">Returned</th>
                <th className="p-3 text-right">Revenue</th><th className="p-3 text-right">Cost</th>
                <th className="p-3 text-right">Profit</th><th className="p-3 text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.name} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-right tabular-nums">{r.sold}</td>
                  <td className="p-3 text-right tabular-nums">{r.returned || "—"}</td>
                  <td className="p-3 text-right tabular-nums">{inr(r.revenue)}</td>
                  <td className="p-3 text-right tabular-nums text-muted-foreground">{inr(r.cost)}</td>
                  <td className={cn("p-3 text-right tabular-nums font-semibold", r.profit < 0 ? "text-destructive" : "text-primary")}>{inr(r.profit)}</td>
                  <td className="p-3 text-right tabular-nums">{r.margin.toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="bg-secondary/40 font-semibold">
                <td className="p-3">Total</td>
                <td className="p-3 text-right tabular-nums">{report.totals.sold}</td>
                <td className="p-3 text-right tabular-nums">{report.totals.returned || "—"}</td>
                <td className="p-3 text-right tabular-nums">{inr(report.totals.revenue)}</td>
                <td className="p-3 text-right tabular-nums">{inr(report.totals.cost)}</td>
                <td className="p-3 text-right tabular-nums">{inr(report.totals.profit)}</td>
                <td className="p-3 text-right tabular-nums">
                  {report.totals.revenue > 0 ? ((report.totals.profit / report.totals.revenue) * 100).toFixed(1) : "0.0"}%
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
