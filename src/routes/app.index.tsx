import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ShopGate, useShop } from "@/components/ShopGate";
import {
  dayTotals,
  bakiOutstanding,
  dailySeries,
  healthScore,
  healthTrend,
  fmtBDT,
  type Txn,
} from "@/lib/calc";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { aiSummary } from "@/lib/ocr.functions";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Landmark,
  Cloud,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { generateMockTxns } from "@/lib/mockData";
import { InvestorDashboard } from "@/components/InvestorDashboard";
import { VerificationBanner } from "@/components/VerificationBanner";

export const Route = createFileRoute("/app/")({
  component: DashboardRouter,
});

function DashboardRouter() {
  const { roles, loading, rolesLoading } = useAuth();
  if (loading || rolesLoading)
    return <div className="p-8 text-center text-sm text-muted-foreground">…</div>;
  if (roles.includes("investor")) return <InvestorDashboard />;
  return (
    <ShopGate>
      <SmeDashboard />
    </ShopGate>
  );
}

type TxnRow = Txn & { counterparty?: string | null };

function SmeDashboard() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { shop } = useShop();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [recent, setRecent] = useState<TxnRow[]>([]);
  const [verified, setVerified] = useState(false);
  const [summary, setSummary] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const aiSummaryFn = useServerFn(aiSummary);

  useEffect(() => {
    if (!shop) return;
    (async () => {
      const { data } = await supabase
        .from("transactions")
        .select("txn_date,total_amount,type,payment_type,counterparty")
        .eq("shop_id", shop.id)
        .order("txn_date", { ascending: false });
      const real = (data ?? []) as TxnRow[];
      if (real.length === 0) {
        const mock = generateMockTxns();
        setTxns(mock);
        setRecent(
          [...mock]
            .sort((a, b) => (a.txn_date < b.txn_date ? 1 : -1))
            .slice(0, 8)
            .map((m) => ({ ...m, counterparty: null })),
        );
        setIsDemo(true);
      } else {
        setTxns(real as Txn[]);
        setRecent(real.slice(0, 8));
        setIsDemo(false);
      }
      const { data: s } = await supabase
        .from("shops")
        .select("verified")
        .eq("id", shop.id)
        .maybeSingle();
      setVerified(!!s?.verified);
    })();
  }, [shop?.id]);

  const today = dayTotals(txns);
  const baki = bakiOutstanding(txns);
  const series = dailySeries(txns, 30);
  const { score } = healthScore({ txns, verified });
  const trend = healthTrend(txns, verified, 30);

  const totalSales30 = series.reduce((a, b) => a + b.sales, 0);
  const totalExp30 = series.reduce((a, b) => a + b.expenses, 0);
  const netProfit30 = totalSales30 - totalExp30;

  useEffect(() => {
    if (!user || txns.length === 0) return;
    setSummary("");
    aiSummaryFn({
      data: {
        lang,
        metrics: {
          today_sales_BDT: today.sales,
          today_expenses_BDT: today.expenses,
          today_profit_BDT: today.profit,
          outstanding_baki_BDT: baki,
          health_score: score,
          last_30d_sales_BDT: totalSales30,
          last_30d_expenses_BDT: totalExp30,
          last_30d_net_profit_BDT: netProfit30,
          transactions_count: txns.length,
          data_source: isDemo ? "sample" : "real",
        },
      },
    })
      .then((r) => setSummary(r.text))
      .catch(() => {});
    // eslint-disable-next-line
  }, [today.sales, today.expenses, baki, score, lang, totalSales30, totalExp30, isDemo, txns.length]);

  // Masked account number from user id
  const last4 = (user?.id ?? "0000").replace(/[^0-9]/g, "").slice(-4).padStart(4, "0");
  const acctMasked = `****-****-****-${last4}`;

  const metricCards = [
    {
      label: t("today_sales"),
      value: fmtBDT(today.sales),
      icon: TrendingUp,
      tone: "text-success",
      ring: "ring-success/20",
      bg: "bg-success/10",
    },
    {
      label: t("today_expenses"),
      value: fmtBDT(today.expenses),
      icon: TrendingDown,
      tone: "text-destructive",
      ring: "ring-destructive/20",
      bg: "bg-destructive/10",
    },
    {
      label: t("baki_credit"),
      value: fmtBDT(baki),
      icon: Clock,
      tone: "text-warning",
      ring: "ring-warning/20",
      bg: "bg-warning/10",
    },
    {
      label: t("est_profit"),
      value: fmtBDT(today.profit),
      icon: Landmark,
      tone: "text-primary",
      ring: "ring-primary/20",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("weekly_sumup")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">{t("weekly_sumup_sub")}</p>
      </div>

      <VerificationBanner />

      {isDemo && (
        <Card className="flex items-center justify-between border-accent bg-accent/30 p-3">
          <span className="text-xs text-accent-foreground">{t("showing_demo")}</span>
          <Badge variant="secondary">{t("demo_badge")}</Badge>
        </Card>
      )}

      {/* Top section: Account card + metrics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Account Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3D52A0] via-[#2c3e80] to-[#202D62] p-5 text-white shadow-elegant">
          {/* Glass-morphism blobs */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute right-6 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-white/5 backdrop-blur" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                <Cloud className="h-4 w-4" strokeWidth={2.4} />
              </div>
              <div>
                <div className="text-[11px] font-semibold leading-tight">
                  {t("cloudcash_account")}
                </div>
                <div className="text-[10px] text-white/70">{t("premium_account")}</div>
              </div>
            </div>
            <Badge className="border-white/30 bg-white/15 text-[10px] text-white hover:bg-white/20">
              PREMIUM
            </Badge>
          </div>

          <div className="relative mt-7">
            <div className="text-[10px] uppercase tracking-wider text-white/60">
              {t("account_number")}
            </div>
            <div className="mt-1 font-mono text-lg font-semibold tracking-[0.18em]">
              {acctMasked}
            </div>
          </div>

          <div className="relative mt-5 flex items-end justify-between">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-white/60">
                {t("shop")}
              </div>
              <div className="truncate text-sm font-semibold">
                {shop?.name ?? "—"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/60">
                {t("health_score")}
              </div>
              <div className="font-display text-2xl font-bold leading-none">
                {score}
                <span className="text-xs font-medium text-white/70">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2x2 Metric grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {metricCards.map((c) => (
            <Card
              key={c.label}
              className="group relative overflow-hidden p-4 shadow-lg border border-border/50 transition-shadow duration-300 hover:shadow-xl hover:border-primary/20"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-muted-foreground">{c.label}</div>
                  <div className={`mt-2 text-xl font-bold tabular-nums sm:text-2xl transition-colors duration-200 group-hover:text-primary ${c.tone}`}>
                    {c.value}
                  </div>
                </div>
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-110 ${c.bg} ${c.ring}`}
                >
                  <c.icon className={`h-4 w-4 ${c.tone}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-4 shadow-lg border border-border/50 transition-shadow duration-300 hover:shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-bold">
              <span className="h-3 w-3 rounded-full bg-[#3D52A0]" />
              {t("health_30d")}
            </div>
            <Badge variant="outline" className="text-[10px]">
              {score}/100
            </Badge>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 12, border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: 8 }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3D52A0"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 shadow-lg border border-border/50 transition-shadow duration-300 hover:shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-bold">
              <span className="h-3 w-3 rounded-full bg-[#3D52A0]" />
              {t("net_revenue_30d")}
            </div>
            <Badge variant="outline" className="text-[10px]">
              {fmtBDT(netProfit30)}
            </Badge>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis tick={{ fontSize: 10 }} width={36} />
                <Tooltip contentStyle={{ fontSize: 12, border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: 8 }} />
                <Bar dataKey="net" fill="#3D52A0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Table + AI summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Transaction history table */}
        <Card className="overflow-hidden shadow-lg border border-border/50 transition-shadow duration-300 hover:shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div>
              <div className="text-sm font-semibold">{t("txn_history")}</div>
              <div className="text-[11px] text-muted-foreground">{t("recent_txns")}</div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {recent.length}
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">{t("txn_type")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("payment_type")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("date")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("amount")}</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground">
                      {t("no_records")}
                    </td>
                  </tr>
                )}
                {recent.map((r, i) => {
                  const isSale = r.type === "sale";
                  const isExp = r.type === "expense";
                  return (
                    <tr
                      key={i}
                      className={`border-t border-border/40 transition-colors hover:bg-accent/40 ${
                        isSale ? "bg-success/5" : isExp ? "bg-destructive/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            isSale
                              ? "border-success/40 text-success"
                              : isExp
                                ? "border-destructive/40 text-destructive"
                                : ""
                          }`}
                        >
                          {t(r.type)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {t(r.payment_type)}
                      </td>
                      <td className="px-3 py-2 text-xs">{r.txn_date}</td>
                      <td
                        className={`px-3 py-2 text-right font-semibold tabular-nums ${
                          isExp ? "text-destructive" : "text-success"
                        }`}
                      >
                        {fmtBDT(Number(r.total_amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Summary */}
        <Card className="border border-border/50 border-l-4 border-l-[#3D52A0] bg-gradient-to-br from-[#3D52A0]/5 to-transparent p-5 shadow-lg transition-shadow duration-300 hover:shadow-xl">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse text-[#3D52A0]" />
            <span className="font-display text-sm font-semibold text-[#3D52A0]">
              {t("ai_summary")}
            </span>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {[
              { label: "30d Revenue", value: fmtBDT(totalSales30) },
              { label: "30d Expenses", value: fmtBDT(totalExp30) },
              { label: "Net Profit", value: fmtBDT(netProfit30) },
              { label: "Health", value: `${score}/100` },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-white p-2.5 shadow-sm">
                <div className="text-[10px] text-muted-foreground">{m.label}</div>
                <div className="mt-0.5 text-sm font-bold text-[#3D52A0]">{m.value}</div>
              </div>
            ))}
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed">
            {summary || (
              <span className="text-muted-foreground">Generating insights…</span>
            )}
          </p>
        </Card>
      </div>
    </div>
  );
}
