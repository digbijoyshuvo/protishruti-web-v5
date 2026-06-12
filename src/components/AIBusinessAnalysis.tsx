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

const TITLES = {
  en: {
    pricing_landscape: "Current Pricing Landscape",
    market_leader: "Top Performer in Your Category",
    local_demand_trend: "Local Demand Trend",
    supply_risk: "Supply-Side Risk",
    growth_opportunities: "Growth Opportunities",
    profit_boosters: "How to Increase Profit",
    next_week_actions: "Next-Week Action Plan",
    header: "AI Business Analysis",
    sub: (name: string, cat?: string | null) =>
      `Live market insights for ${name}${cat ? ` · ${cat}` : ""}`,
    refresh: "Refresh",
    analyzing: "Analyzing…",
    error: "Failed to generate analysis",
  },
  bn: {
    pricing_landscape: "বর্তমান মূল্যের চিত্র",
    market_leader: "আপনার ক্যাটাগরির শীর্ষ পারফর্মার",
    local_demand_trend: "স্থানীয় চাহিদার ধারা",
    supply_risk: "সরবরাহের ঝুঁকি",
    growth_opportunities: "বৃদ্ধির সুযোগ",
    profit_boosters: "মুনাফা বাড়ানোর উপায়",
    next_week_actions: "পরবর্তী সপ্তাহের কর্ম পরিকল্পনা",
    header: "AI ব্যবসায়িক বিশ্লেষণ",
    sub: (name: string, cat?: string | null) =>
      `${name}${cat ? ` · ${cat}` : ""}-এর জন্য লাইভ মার্কেট বিশ্লেষণ`,
    refresh: "রিফ্রেশ",
    analyzing: "বিশ্লেষণ চলছে…",
    error: "বিশ্লেষণ তৈরি করা যায়নি",
  },
} as const;

const PAIR_KEYS = ["pricing_landscape", "market_leader", "local_demand_trend", "supply_risk"] as const;
const LIST_KEYS = ["growth_opportunities", "profit_boosters", "next_week_actions"] as const;

const STYLE_BY_KEY: Record<string, { icon: any; accent: string; color: string; border: string }> = {
  pricing_landscape: { icon: Tag, accent: "from-blue-500/15 to-blue-500/0", color: "text-blue-600", border: "border-l-blue-500" },
  market_leader: { icon: Crown, accent: "from-amber-500/15 to-amber-500/0", color: "text-amber-600", border: "border-l-amber-500" },
  local_demand_trend: { icon: TrendingUp, accent: "from-emerald-500/15 to-emerald-500/0", color: "text-emerald-600", border: "border-l-emerald-500" },
  supply_risk: { icon: AlertTriangle, accent: "from-rose-500/15 to-rose-500/0", color: "text-rose-600", border: "border-l-rose-500" },
  growth_opportunities: { icon: Rocket, accent: "from-violet-500/15 to-violet-500/0", color: "text-violet-600", border: "border-l-violet-500" },
  profit_boosters: { icon: Coins, accent: "from-teal-500/15 to-teal-500/0", color: "text-teal-600", border: "border-l-teal-500" },
  next_week_actions: { icon: CalendarCheck, accent: "from-[#3D52A0]/15 to-[#3D52A0]/0", color: "text-[#3D52A0]", border: "border-l-[#3D52A0]" },
};

export function AIBusinessAnalysis(props: Props) {
  const run = useServerFn(aiBusinessAnalysis);
  const [data, setData] = useState<BusinessAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const tr = TITLES[props.lang];

  const fetchIt = () => {
    setLoading(true);
    setErr(null);
    run({ data: props })
      .then((d) => setData(d))
      .catch((e) => setErr(e?.message ?? tr.error))
      .finally(() => setLoading(false));
  };

  // Auto-run once on mount / when key metric changes
  const sig = JSON.stringify([props.shop.category, props.metrics, props.lang]);
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
              {tr.header}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {tr.sub(props.shop.name ?? (props.lang === "bn" ? "আপনার দোকান" : "your shop"), props.shop.category)}
            </div>
          </div>
        </div>
        <button
          onClick={fetchIt}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:text-[#3D52A0] disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? tr.analyzing : tr.refresh}
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
              {PAIR_KEYS.map((k) => {
                const s = STYLE_BY_KEY[k];
                const Icon = s.icon;
                const text = (data as any)[k] as string;
                return (
                  <div
                    key={k}
                    className={`rounded-xl border border-border/50 border-l-4 ${s.border} bg-gradient-to-br ${s.accent} p-3.5 transition hover:shadow-md`}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${s.color}`} />
                      <div className={`text-xs font-semibold ${s.color}`}>{tr[k]}</div>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80">{text}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {LIST_KEYS.map((k) => {
                const s = STYLE_BY_KEY[k];
                const Icon = s.icon;
                const items = ((data as any)[k] as string[]) ?? [];
                return (
                  <div
                    key={k}
                    className={`rounded-xl border border-border/50 border-l-4 ${s.border} bg-gradient-to-br ${s.accent} p-3.5`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${s.color}`} />
                        <div className={`text-xs font-semibold ${s.color}`}>{tr[k]}</div>
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