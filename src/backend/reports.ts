import { COST_RATIO, type Product, type Sale } from "./inventory";

export type Period = "day" | "week" | "month" | "year";

/** Start/end of the period containing `ref`. Weeks start on Monday. */
export function periodRange(period: Period, ref: Date) {
  const s = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  let e: Date;
  if (period === "day") e = new Date(s.getTime() + 864e5);
  else if (period === "week") {
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
    e = new Date(s.getTime() + 7 * 864e5);
  } else if (period === "month") {
    s.setDate(1);
    e = new Date(s.getFullYear(), s.getMonth() + 1, 1);
  } else {
    s.setMonth(0, 1);
    e = new Date(s.getFullYear() + 1, 0, 1);
  }
  return { start: s, end: e };
}

export function shiftRef(period: Period, ref: Date, dir: number) {
  const d = new Date(ref);
  if (period === "day") d.setDate(d.getDate() + dir);
  else if (period === "week") d.setDate(d.getDate() + 7 * dir);
  else if (period === "month") d.setMonth(d.getMonth() + dir);
  else d.setFullYear(d.getFullYear() + dir);
  return d;
}

export function periodLabel(period: Period, ref: Date) {
  const { start, end } = periodRange(period, ref);
  const f = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-IN", o);
  if (period === "day") return f(start, { day: "2-digit", month: "short", year: "numeric" });
  if (period === "week")
    return `${f(start, { day: "2-digit", month: "short" })} – ${f(new Date(end.getTime() - 864e5), { day: "2-digit", month: "short", year: "numeric" })}`;
  if (period === "month") return f(start, { month: "long", year: "numeric" });
  return String(start.getFullYear());
}

export type ProductRow = {
  name: string; sold: number; returned: number; revenue: number; cost: number; profit: number; margin: number;
};

export function buildReport(products: Product[], sales: Sale[], period: Period, ref: Date) {
  const { start, end } = periodRange(period, ref);
  const inRange = sales.filter((s) => {
    const t = new Date(s.created_at).getTime();
    return t >= start.getTime() && t < end.getTime();
  });
  const byId = new Map<string, ProductRow>();
  for (const s of inRange) {
    const p = products.find((x) => x.id === s.product_id);
    const unit = Number(s.unit_price);
    const kept = s.quantity - (s.returned_quantity ?? 0);
    const revenue = unit * kept * (1 - Number(s.discount) / 100);
    const cp = Number(p?.cost_price ?? 0) > 0 ? Number(p!.cost_price) : unit * COST_RATIO;
    const row = byId.get(s.product_id) ?? { name: p?.name ?? "Deleted product", sold: 0, returned: 0, revenue: 0, cost: 0, profit: 0, margin: 0 };
    row.sold += kept;
    row.returned += s.returned_quantity ?? 0;
    row.revenue += revenue;
    row.cost += cp * kept;
    row.profit = row.revenue - row.cost;
    row.margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
    byId.set(s.product_id, row);
  }
  const rows = [...byId.values()].sort((a, b) => b.profit - a.profit);
  const totals = rows.reduce(
    (t, r) => ({ sold: t.sold + r.sold, returned: t.returned + r.returned, revenue: t.revenue + r.revenue, cost: t.cost + r.cost, profit: t.profit + r.profit }),
    { sold: 0, returned: 0, revenue: 0, cost: 0, profit: 0 },
  );
  return { rows, totals, bills: inRange.length, sales: inRange };
}

export async function downloadReportExcel(opts: {
  label: string; products: Product[]; report: ReturnType<typeof buildReport>;
}) {
  const { default: writeXlsxFile } = await import("write-excel-file");
  const H = (value: string) => ({ value, fontWeight: "bold" as const, backgroundColor: "#F3E7C4" });
  const money = "#,##0.00";
  const r2 = (n: number) => Math.round(n * 100) / 100;

  const summary = [
    [H("Report"), { value: opts.label }],
    [H("Bills"), { value: opts.report.bills }],
    [H("Items sold"), { value: opts.report.totals.sold }],
    [H("Items returned"), { value: opts.report.totals.returned }],
    [H("Revenue (₹)"), { value: r2(opts.report.totals.revenue), format: money }],
    [H("Cost (₹)"), { value: r2(opts.report.totals.cost), format: money }],
    [H("Profit (₹)"), { value: r2(opts.report.totals.profit), format: money }],
  ];

  const perProduct = [
    ["Product", "Sold", "Returned", "Revenue (₹)", "Cost (₹)", "Profit (₹)", "Margin %"].map(H),
    ...opts.report.rows.map((r) => [
      { value: r.name }, { value: r.sold }, { value: r.returned },
      { value: r2(r.revenue), format: money }, { value: r2(r.cost), format: money },
      { value: r2(r.profit), format: money }, { value: r2(r.margin), format: "0.0" },
    ]),
  ];

  const nameOf = (id: string) => opts.products.find((p) => p.id === id)?.name ?? "Deleted product";
  const bills = [
    ["Date", "Bill no", "Product", "Customer", "Phone", "Payment", "Qty", "Returned", "Price (₹)", "Discount %", "Amount (₹)"].map(H),
    ...opts.report.sales.map((s) => {
      const kept = s.quantity - s.returned_quantity;
      return [
        { value: new Date(s.created_at), format: "dd-mm-yyyy hh:mm" },
        { value: s.invoice_no }, { value: nameOf(s.product_id) },
        { value: s.customer_name }, { value: s.customer_phone },
        { value: s.payment_method.toUpperCase() }, { value: s.quantity }, { value: s.returned_quantity },
        { value: Number(s.unit_price), format: money }, { value: Number(s.discount) },
        { value: r2(Number(s.unit_price) * kept * (1 - Number(s.discount) / 100)), format: money },
      ];
    }),
  ];

  await writeXlsxFile([summary, perProduct, bills] as any, {
    sheets: ["Summary", "Profit by product", "Bills"],
    columns: [
      [{ width: 18 }, { width: 28 }],
      [{ width: 30 }, { width: 8 }, { width: 10 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 10 }],
      [{ width: 18 }, { width: 18 }, { width: 26 }, { width: 20 }, { width: 16 }, { width: 10 }, { width: 6 }, { width: 10 }, { width: 12 }, { width: 10 }, { width: 14 }],
    ] as any,
    fontFamily: "Arial",
    fileName: `report-${opts.label.replace(/[^a-z0-9]+/gi, "-")}.xlsx`,
  } as any);
}
