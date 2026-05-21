import { Card } from "@/components/ui/card";
import { AnimatedCounter } from "@/frontend/components/animated-counter";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: number;
  icon: LucideIcon;
  prefix?: string;
  decimals?: number;
  accent?: "gold" | "blue" | "green" | "red" | "violet";
  hint?: string;
}

const accents: Record<NonNullable<Props["accent"]>, string> = {
  gold: "from-amber-400/20 to-amber-500/5 text-amber-600",
  blue: "from-sky-400/20 to-sky-500/5 text-sky-600",
  green: "from-emerald-400/20 to-emerald-500/5 text-emerald-600",
  red: "from-rose-400/20 to-rose-500/5 text-rose-600",
  violet: "from-violet-400/20 to-violet-500/5 text-violet-600",
};

export function KpiCard({ label, value, icon: Icon, prefix, decimals = 0, accent = "gold", hint }: Props) {
  return (
    <Card className="card-hover relative overflow-hidden border bg-card p-5">
      <div className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl bg-gradient-to-br opacity-60", accents[accent])} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
          <div className="mt-2 text-3xl font-bold font-display tracking-tight">
            <AnimatedCounter value={value} prefix={prefix} decimals={decimals} />
          </div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("rounded-xl p-2.5 bg-gradient-to-br", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
