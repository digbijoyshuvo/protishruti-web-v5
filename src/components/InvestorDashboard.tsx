import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Wallet,
  Briefcase,
  Clock,
  Sparkles,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Plus,
  Settings2,
  Search,
  CheckCircle2,
} from "lucide-react";
import {
  DEMO_SMES,
  SME_CATEGORIES,
  portfolioMetrics,
  buildGrowthSeries,
  buildActivity,
  fundingProgress,
  formatBDT,
  type DemoSME,
  type ActivityItem,
} from "@/lib/demoSMEs";
import { Recommendations } from "@/components/investor/Recommendations";
import { SMEExplorer } from "@/components/investor/SMEExplorer";
import { SMECard, SMECardSkeleton } from "@/components/investor/SMECard";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

// ---- Small UI primitives ----------------------------------------------------

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
};

function StatCard({ label, value, delta, trend = "up", icon: Icon, accent = "from-primary/15 to-primary/0" }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/60 bg-white/70 p-5 shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${accent} blur-2xl`} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="font-display text-2xl font-bold tabular-nums sm:text-3xl">{value}</div>
          {delta && (
            <div
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                trend === "up" ? "text-success" : "text-destructive"
              }`}
            >
              {trend === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {delta}
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform duration-200 group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function ActivityRow({ a }: { a: ActivityItem }) {
  const tones: Record<ActivityItem["type"], { bg: string; text: string; icon: React.ReactNode }> = {
    investment: { bg: "bg-success/10", text: "text-success", icon: <ArrowUpRight className="h-4 w-4" /> },
    payout: { bg: "bg-primary/10", text: "text-primary", icon: <Wallet className="h-4 w-4" /> },
    milestone: { bg: "bg-warning/10", text: "text-warning", icon: <CheckCircle2 className="h-4 w-4" /> },
    request: { bg: "bg-accent text-accent-foreground", text: "text-foreground", icon: <Clock className="h-4 w-4" /> },
  };
  const tone = tones[a.type];
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${tone.bg} ${tone.text}`}>
        {tone.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{a.sme}</div>
        <div className="truncate text-xs text-muted-foreground">{a.message}</div>
      </div>
      <div className="text-right">
        {a.amount && <div className="text-sm font-semibold tabular-nums">{formatBDT(a.amount)}</div>}
        <div className="text-[10px] text-muted-foreground">{a.time}</div>
      </div>
    </div>
  );
}

// ---- Main component ---------------------------------------------------------

export function InvestorDashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);
  useEffect(() => {
    const tm = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(tm);
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("investor_profiles")
        .select("id")
        .eq("user_id", uid)
        .maybeSingle();
      if (!cancel) setIsDemo(!data);
    })();
    return () => {
      cancel = true;
    };
  }, []);


  const smes = DEMO_SMES;
  const metrics = useMemo(() => portfolioMetrics(smes), [smes]);
  const growthSeries = useMemo(() => buildGrowthSeries(smes), [smes]);
  const activity = useMemo(() => buildActivity(smes), [smes]);

  const trending = useMemo<DemoSME[]>(
    () =>
      [...smes]
        .filter((s) => s.trending || s.featured)
        .sort((a, b) => b.investorsCount - a.investorsCount)
        .slice(0, 3),
    [smes],
  );

  // Allocation by category, used by the pie chart.
  const categoryAllocation = useMemo(() => {
    return SME_CATEGORIES.map((cat) => {
      const inCat = smes.filter((s) => s.category === cat);
      const value = inCat.reduce((a, s) => a + s.currentInvestment, 0);
      return { name: cat, value };
    }).filter((d) => d.value > 0);
  }, [smes]);

  const pieColors = ["#3D52A0", "#5b6fc2", "#8E9DD3", "#202D62", "#F59E0B", "#10B981", "#EC4899", "#6366F1"];

  return (
    <div className="space-y-8">
      {/* ---- Hero header ---- */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-[#3D52A0] via-[#2c3e80] to-[#202D62] p-6 text-white shadow-elegant sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge className="border-white/30 bg-white/15 text-white hover:bg-white/20">
              <Sparkles className="mr-1 h-3 w-3" /> {t("inv_portal")}
            </Badge>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("welcome_investor")}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-white/80 sm:text-base">
              {t("welcome_investor_sub")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary" className="rounded-full bg-white text-primary hover:bg-white/90">
              <a href="#explore"><Search className="mr-1 h-4 w-4" />{t("explore_smes")}</a>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-full border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20">
              <Link to="/app/investors"><Settings2 className="mr-1 h-4 w-4" />{t("investor_prefs_btn")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {isDemo && (
        <Card className="flex items-center justify-between border-accent bg-accent/30 p-3">
          <span className="text-xs text-accent-foreground">{t("showing_demo_investor")}</span>
          <Badge variant="secondary">{t("demo_badge")}</Badge>
        </Card>
      )}

      {/* ---- KPI strip ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label={t("kpi_total_investments")}
          value={formatBDT(metrics.totalInvestments)}
          delta={t("delta_mom")}
          trend="up"
          icon={Wallet}
          accent="from-primary/20 to-primary/0"
        />
        <StatCard
          label={t("kpi_avg_roi")}
          value={`${metrics.avgROI}%`}
          delta={t("delta_pts")}
          trend="up"
          icon={TrendingUp}
          accent="from-success/30 to-success/0"
        />
        <StatCard
          label={t("kpi_active_smes")}
          value={String(metrics.active)}
          delta={`${smes.length} ${t("delta_total_suffix")}`}
          trend="up"
          icon={Briefcase}
          accent="from-indigo-400/30 to-indigo-400/0"
        />
        <StatCard
          label={t("kpi_pending")}
          value={String(metrics.pending)}
          delta={t("delta_awaiting")}
          trend="up"
          icon={Clock}
          accent="from-warning/30 to-warning/0"
        />
        <StatCard
          label={t("kpi_growth")}
          value={`${metrics.monthlyGrowth}%`}
          delta={t("delta_vs_last")}
          trend="up"
          icon={Activity}
          accent="from-pink-400/30 to-pink-400/0"
        />
      </div>

      {/* ---- Analytics + Activity ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden border-border/60 p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">{t("portfolio_growth")}</h3>
              <p className="text-xs text-muted-foreground">{t("portfolio_growth_sub")}</p>
            </div>
            <Badge variant="outline" className="rounded-full">
              <TrendingUp className="mr-1 h-3 w-3 text-success" />
              {formatBDT(metrics.totalInvestments)}
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthSeries}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3D52A0" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#3D52A0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v) => formatBDT(v)} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}
                  formatter={(v: number) => formatBDT(v)}
                />
                <Area type="monotone" dataKey="value" stroke="#3D52A0" strokeWidth={2.5} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border/60 p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">{t("recent_activity")}</h3>
              <p className="text-xs text-muted-foreground">{t("recent_activity_sub")}</p>
            </div>
            <Badge variant="secondary" className="rounded-full">{activity.length}</Badge>
          </div>
          <div className="-mx-2 space-y-1">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/60" />
                ))
              : activity.map((a) => <ActivityRow key={a.id} a={a} />)}
          </div>
        </Card>
      </div>

      {/* ---- Allocation + ROI distribution + Quick actions ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border/60 p-5 shadow-card">
          <h3 className="mb-1 font-display text-lg font-bold">{t("allocation_by_sector")}</h3>
          <p className="mb-3 text-xs text-muted-foreground">{t("allocation_sub")}</p>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryAllocation}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {categoryAllocation.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatBDT(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border/60 p-5 shadow-card">
          <h3 className="mb-1 font-display text-lg font-bold">{t("roi_by_sector")}</h3>
          <p className="mb-3 text-xs text-muted-foreground">{t("roi_by_sector_sub")}</p>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart
                data={SME_CATEGORIES.map((cat) => {
                  const arr = smes.filter((s) => s.category === cat);
                  return {
                    cat: cat.slice(0, 4),
                    roi: arr.length ? Math.round((arr.reduce((a, s) => a + s.roi, 0) / arr.length) * 10) / 10 : 0,
                  };
                })}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="cat" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="roi" fill="#3D52A0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border/60 p-5 shadow-card">
          <h3 className="mb-1 font-display text-lg font-bold">{t("quick_actions")}</h3>
          <p className="mb-3 text-xs text-muted-foreground">{t("quick_actions_sub")}</p>
          <div className="space-y-2">
            {([
              { href: "#explore", label: t("qa_discover"), icon: Search, external: true },
              { href: "/app/investors", label: t("qa_edit_profile"), icon: Settings2, external: false },
              { href: "#recommended", label: t("qa_view_recs"), icon: Sparkles, external: true },
              { href: "/app/settings", label: t("qa_account"), icon: Plus, external: false },
            ] as const).map((item) => {
              const inner = (
                <>
                  <span className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </>
              );
              const cls =
                "flex items-center justify-between rounded-xl border border-border/60 bg-white px-3 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card";
              return item.external ? (
                <a key={item.label} href={item.href} className={cls}>{inner}</a>
              ) : (
                <Link key={item.label} to={item.href} className={cls}>{inner}</Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ---- Trending ---- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
              <Flame className="h-5 w-5 text-orange-500" /> {t("trending_smes")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("trending_sub")}</p>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SMECardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((s) => (
              <SMECard key={s.id} sme={s} />
            ))}
          </div>
        )}
      </section>

      {/* ---- Recommendations ---- */}
      <div id="recommended" className="scroll-mt-24">
        <Recommendations smes={smes} />
      </div>

      {/* ---- Explorer ---- */}
      <section id="explore" className="scroll-mt-24 space-y-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">{t("explore_all_smes")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("explore_sub_prefix")} {smes.length} {t("explore_sub_suffix")}
          </p>
        </div>
        <SMEExplorer smes={smes} loading={loading} />
      </section>

      {/* ---- Footer summary card ---- */}
      <Card className="flex flex-col items-center justify-between gap-3 border-border/60 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 p-5 text-center shadow-card sm:flex-row sm:text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-sm font-bold">{t("deepen_portfolio")}</div>
            <div className="text-xs text-muted-foreground">
              {t("deepen_sub")}
            </div>
          </div>
        </div>
        <Button asChild className="rounded-full bg-gradient-primary text-white shadow">
          <Link to="/app/investors">{t("refine_preferences")}</Link>
        </Button>
      </Card>
    </div>
  );
}

// Helper: progress reused below if needed.
export const _progress = fundingProgress;
