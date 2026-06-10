import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useServerFn } from "@tanstack/react-start";
import { aiBusinessAnalysis, type BusinessAnalysis } from "@/lib/ocr.functions";
import {
  Tag,
  Crown,
  TrendingUp,
  AlertTriangle,
  Rocket,
  Coins,
  CalendarCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";

type Props = {
  lang: "en" | "bn";
  shop: { name?: string; category?: string | null; address?: string | null };
  metrics: Record<string, number | string>;
  topCounterparties?: string[];
};

const SECTION_STYLES = [
  { key: "pricing_landscape", title: "Current Pricing Landscape", icon: Tag, accent: "from-blue-500/15 to-blue-500/0", color: "text-blue-600", border: "border-l-blue-500" },
  { key: "market_leader", title: "Top Performer in Your Category", icon: Crown, accent: "from-amber-500/15 to-amber-500/0", color: "text-amber-600", border: "border-l-amber-500" },
  { key: "local_demand_trend", title: "Local Demand Trend", icon: TrendingUp, accent: "from-emerald-500/15 to-emerald-500/0", color: "text-emerald-600", border: "border-l-emerald-500" },
  { key: "supply_risk", title: "Supply-Side Risk", icon: AlertTriangle, accent: "from-rose-500/15 to-rose-500/0", color: "text-rose-600", border: "border-l-rose-500" },
] as const;

const LIST_SECTIONS = [
  { key: "growth_opportunities", title: "Growth Opportunities", icon: Rocket, accent: "from-violet-500/15 to-violet-500/0", color: "text-violet-600", border: "border-l-violet-500" },
  { key: "profit_boosters", title: "How to Increase Profit", icon: Coins, accent: "from-teal-500/15 to-teal-500/0", color: "text-teal-600", border: "border-l-teal-500" },
  { key: "next_week_actions", title: "Next-Week Action Plan", icon: CalendarCheck, accent: "from-[#3D52A0]/15 to-[#3D52A0]/0", color: "text-[#3D52A0]", border: "border-l-[#3D52A0]" },
] as const;

export function AIBusinessAnalysis(props: Props) {
  const run = useServerFn(aiBusinessAnalysis);
  const [data, setData] = useState<BusinessAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchIt = () => {
    setLoading(true);
    setErr(null);
    run({ data: props })
      .then((d) => setData(d))
      .catch((e) => setErr(e?.message ?? "Failed to generate analysis"))
      .finally(() => setLoading(false));
  };

  // Auto-run once on mount / when key metric changes
  const sig = JSON.stringify([props.shop.category, props.metrics]);
  useEffect(() => {
    fetchIt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return (
    <Card className="overflow-hidden border border-border/50 shadow-lg">
      <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-[#3D52A0]/10 to-transparent px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-pulse text-[#3D52A0]" />
          <div>
            <div className="font-display text-sm font-semibold text-[#3D52A0]">
              AI Business Analysis
            </div>
            <div className="text-[11px] text-muted-foreground">
              Live market insights for {props.shop.name ?? "your shop"}
              {props.shop.category ? ` · ${props.shop.category}` : ""}
            </div>
          </div>
        </div>
        <button
          onClick={fetchIt}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:text-[#3D52A0] disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analyzing…" : "Refresh"}
        </button>
      </div>

      <div className="p-4">
        {err && (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            {err}
          </div>
        )}

        {!data && loading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SECTION_STYLES.map((s) => {
                const Icon = s.icon;
                const text = (data as any)[s.key] as string;
                return (
                  <div
                    key={s.key}
                    className={`rounded-xl border border-border/50 border-l-4 ${s.border} bg-gradient-to-br ${s.accent} p-3.5 transition hover:shadow-md`}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${s.color}`} />
                      <div className={`text-xs font-semibold ${s.color}`}>{s.title}</div>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80">{text}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {LIST_SECTIONS.map((s) => {
                const Icon = s.icon;
                const items = ((data as any)[s.key] as string[]) ?? [];
                return (
                  <div
                    key={s.key}
                    className={`rounded-xl border border-border/50 border-l-4 ${s.border} bg-gradient-to-br ${s.accent} p-3.5`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${s.color}`} />
                        <div className={`text-xs font-semibold ${s.color}`}>{s.title}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {items.length}
                      </Badge>
                    </div>
                    <ul className="space-y-1.5">
                      {items.map((it, i) => (
                        <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground/80">
                          <span className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${s.color.replace("text-", "bg-")}`} />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}