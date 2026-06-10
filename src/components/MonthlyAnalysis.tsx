import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerFn } from "@tanstack/react-start";
import { aiSummary } from "@/lib/ocr.functions";
import { fmtBDT, type Txn } from "@/lib/calc";
import { CalendarDays, TrendingUp, TrendingDown, Wallet, Sparkles, RefreshCw } from "lucide-react";

export function MonthlyAnalysis({
  txns,
  lang,
  healthScore,
}: {
  txns: Txn[];
  lang: "en" | "bn";
  healthScore: number;
}) {
  const summaryFn = useServerFn(aiSummary);
  const [verdict, setVerdict] = useState("");
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const monthStart = new Date(y, m, 1).toISOString().slice(0, 10);
    const monthEnd = new Date(y, m + 1, 0).toISOString().slice(0, 10);
    const prevStart = new Date(y, m - 1, 1).toISOString().slice(0, 10);
    const prevEnd = new Date(y, m, 0).toISOString().slice(0, 10);

    const sumIn = (from: string, to: string) => {
      const inRange = txns.filter((t) => t.txn_date >= from && t.txn_date <= to);
      const sales = inRange
        .filter((t) => t.type === "sale")
        .reduce((s, t) => s + Number(t.total_amount), 0);
      const returns = inRange
        .filter((t) => t.type === "return")
        .reduce((s, t) => s + Number(t.total_amount), 0);
      const expenses = inRange
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + Number(t.total_amount), 0);
      const net = sales - returns;
      return { sales: net, expenses, profit: net - expenses, count: inRange.length };
    };

    const cur = sumIn(monthStart, monthEnd);
    const prev = sumIn(prevStart, prevEnd);
    const daysElapsed = Math.max(1, now.getDate());
    const avgDailySales = cur.sales / daysElapsed;
    const margin = cur.sales > 0 ? (cur.profit / cur.sales) * 100 : 0;
    const growth =
      prev.sales > 0 ? ((cur.sales - prev.sales) / prev.sales) * 100 : cur.sales > 0 ? 100 : 0;
    const monthLabel = now.toLocaleString(lang === "bn" ? "bn-BD" : "en-US", {
      month: "long",
      year: "numeric",
    });
    return { cur, prev, avgDailySales, margin, growth, monthLabel };
  }, [txns, lang]);

  const fetchVerdict = () => {
    setLoading(true);
    setVerdict("");
    summaryFn({
      data: {
        lang,
        goal:
          "monthly business health verdict. Tell the owner clearly whether this month is GOOD, AVERAGE, or NEEDS IMPROVEMENT. Compare vs last month, mention profit margin, and give 1 concrete next step. 3-4 short sentences, encouraging but honest.",
        metrics: {
          month: stats.monthLabel,
          this_month_sales_BDT: Math.round(stats.cur.sales),
          this_month_expenses_BDT: Math.round(stats.cur.expenses),
          this_month_profit_BDT: Math.round(stats.cur.profit),
          last_month_sales_BDT: Math.round(stats.prev.sales),
          last_month_profit_BDT: Math.round(stats.prev.profit),
          growth_vs_last_month_pct: Math.round(stats.growth),
          profit_margin_pct: Math.round(stats.margin),
          avg_daily_sales_BDT: Math.round(stats.avgDailySales),
          transactions_count: stats.cur.count,
          health_score: healthScore,
        },
      },
    })
      .then((r) => setVerdict(r.text))
      .catch(() => setVerdict(""))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (txns.length === 0) return;
    fetchVerdict();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.cur.sales, stats.cur.expenses, lang]);

  const isPositive = stats.profit_positive ?? stats.cur.profit >= 0;
  const growthUp = stats.growth >= 0;
  const tone =
    stats.margin >= 15 && growthUp
      ? { label: lang === "bn" ? "ভালো অবস্থা" : "Doing Great", cls: "border-success/40 text-success bg-success/10" }
      : stats.margin >= 5
        ? { label: lang === "bn" ? "মাঝারি" : "Average", cls: "border-warning/40 text-warning bg-warning/10" }
        : { label: lang === "bn" ? "উন্নতি প্রয়োজন" : "Needs Improvement", cls: "border-destructive/40 text-destructive bg-destructive/10" };

  return (
    <Card className="overflow-hidden shadow-lg border border-border/50 transition-shadow duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">
              {lang === "bn" ? "মাসিক বিশ্লেষণ" : "Monthly Analysis"}
            </div>
            <div className="text-[11px] text-muted-foreground">{stats.monthLabel}</div>
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] ${tone.cls}`}>
          {tone.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="rounded-xl border border-border/50 bg-success/5 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            {lang === "bn" ? "মাসিক বিক্রি" : "Sales"}
          </div>
          <div className="mt-1 text-lg font-bold tabular-nums text-success">
            {fmtBDT(stats.cur.sales)}
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-destructive/5 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            {lang === "bn" ? "মাসিক খরচ" : "Expenses"}
          </div>
          <div className="mt-1 text-lg font-bold tabular-nums text-destructive">
            {fmtBDT(stats.cur.expenses)}
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-primary/5 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            {lang === "bn" ? "নিট লাভ" : "Net Profit"}
          </div>
          <div className={`mt-1 text-lg font-bold tabular-nums ${isPositive ? "text-primary" : "text-destructive"}`}>
            {fmtBDT(stats.cur.profit)}
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-accent/40 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {lang === "bn" ? "মুনাফা মার্জিন" : "Profit Margin"}
          </div>
          <div className="mt-1 text-lg font-bold tabular-nums">{stats.margin.toFixed(1)}%</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-2 text-[11px]">
        <span className="text-muted-foreground">
          {lang === "bn" ? "গত মাসের তুলনায়" : "vs last month"}
        </span>
        <span className={`font-semibold ${growthUp ? "text-success" : "text-destructive"}`}>
          {growthUp ? "▲" : "▼"} {Math.abs(stats.growth).toFixed(1)}%
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 px-4 pb-3 text-[11px]">
        <span className="text-muted-foreground">
          {lang === "bn" ? "দৈনিক গড় বিক্রি" : "Avg daily sales"}
        </span>
        <span className="font-semibold tabular-nums">{fmtBDT(stats.avgDailySales)}</span>
      </div>

      <div className="border-t border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {lang === "bn" ? "AI মাসিক রায়" : "AI Monthly Verdict"}
          </div>
          <button
            onClick={fetchVerdict}
            disabled={loading}
            className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[10px] font-medium hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            {lang === "bn" ? "রিফ্রেশ" : "Refresh"}
          </button>
        </div>
        {loading && !verdict ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-9/12" />
          </div>
        ) : verdict ? (
          <p className="text-xs leading-relaxed text-foreground/90">{verdict}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {lang === "bn"
              ? "এই মাসে এখনো যথেষ্ট লেনদেন নেই।"
              : "Not enough activity yet this month."}
          </p>
        )}
      </div>
    </Card>
  );
}