import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Landmark,
  Cloud,
  ArrowLeft,
} from "lucide-react";
import {
  dayTotals,
  bakiOutstanding,
  dailySeries,
  healthScore,
  healthTrend,
  fmtBDT,
} from "@/lib/calc";
import { generateMockTxns } from "@/lib/mockData";
import logoUrl from "@/assets/protishruti-logo.png";
import { SMEProfileView } from "@/components/sme/SMEProfileView";
import type { ShopProfile } from "@/lib/shopProfile";

export const Route = createFileRoute("/demo/sme")({ component: DemoSme });

const DEMO_PROFILE: ShopProfile = {
  id: "demo-shop",
  owner_id: "demo-owner",
  name: "Rahim Kirana Store",
  address: "House 24, Road 5, Mirpur, Dhaka",
  category: "Retail",
  contact_phone: "+8801711000000",
  contact_email: "rahim@kirana.example",
  trade_license_no: "DSCC-2021-00874",
  owner_nid: null,
  business_age_years: 8,
  verified: true,
  logo_path: null,
  cover_path: null,
  description:
    "A neighbourhood kirana store serving 600+ families with daily essentials, fresh produce, and reliable digital payments. Expanding to a second branch with cold storage for dairy.",
  founded_year: 2017,
  website: "https://rahimkirana.example",
  social_links: { facebook: "https://facebook.com", instagram: "https://instagram.com" },
  funding_goal: 800000,
  current_funding: 520000,
  roi_expectation: 16,
  monthly_revenue: 180000,
  team_size: 5,
  risk_level: "low",
  tags: ["kirana", "daily-essentials", "verified", "expansion"],
  owner_display_name: "Rahim Uddin",
};


function DemoSme() {
  const txns = useMemo(() => generateMockTxns(7), []);
  const today = dayTotals(txns);
  const baki = bakiOutstanding(txns);
  const series = dailySeries(txns, 30);
  const { score } = healthScore({ txns, verified: true });
  const trend = healthTrend(txns, true, 30);
  const totalSales30 = series.reduce((a, b) => a + b.sales, 0);
  const totalExp30 = series.reduce((a, b) => a + b.expenses, 0);
  const netProfit30 = totalSales30 - totalExp30;
  const recent = [...txns]
    .sort((a, b) => (a.txn_date < b.txn_date ? 1 : -1))
    .slice(0, 8);

  const metricCards = [
    { label: "Today's Sales", value: fmtBDT(today.sales), icon: TrendingUp, tone: "text-success", bg: "bg-success/10", ring: "ring-success/20" },
    { label: "Today's Expenses", value: fmtBDT(today.expenses), icon: TrendingDown, tone: "text-destructive", bg: "bg-destructive/10", ring: "ring-destructive/20" },
    { label: "Baki / Credit", value: fmtBDT(baki), icon: Clock, tone: "text-warning", bg: "bg-warning/10", ring: "ring-warning/20" },
    { label: "Est. Profit", value: fmtBDT(today.profit), icon: Landmark, tone: "text-primary", bg: "bg-primary/10", ring: "ring-primary/20" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Protishruti Analytics" className="h-10 w-auto object-contain" />
            <Badge className="bg-gradient-to-r from-[#3D52A0] to-[#202D62] text-white">✨ SME Demo</Badge>
          </div>
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="h-4 w-4" /> Exit demo
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
        <Card className="flex items-center justify-between border-accent bg-accent/30 p-3">
          <span className="text-xs text-accent-foreground">
            This is a sample SME owner dashboard with mock data. Sign up to manage your real shop.
          </span>
          <Badge variant="secondary">DEMO</Badge>
        </Card>

        <section className="space-y-2">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Business Profile</h2>
            <p className="text-sm text-muted-foreground">How investors see your shop — cover image, funding goal, ROI, risk and contact.</p>
          </div>
          <SMEProfileView shop={DEMO_PROFILE} />
        </section>


        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Weekly summary</h1>
          <p className="mt-2 text-base text-muted-foreground">A snapshot of your shop's last 30 days</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3D52A0] via-[#2c3e80] to-[#202D62] p-5 text-white shadow-elegant">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <Cloud className="h-4 w-4" strokeWidth={2.4} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold leading-tight">CloudCash Account</div>
                  <div className="text-[10px] text-white/70">Premium</div>
                </div>
              </div>
              <Badge className="border-white/30 bg-white/15 text-[10px] text-white hover:bg-white/20">DEMO</Badge>
            </div>
            <div className="relative mt-7">
              <div className="text-[10px] uppercase tracking-wider text-white/60">Account number</div>
              <div className="mt-1 font-mono text-lg font-semibold tracking-[0.18em]">****-****-****-0007</div>
            </div>
            <div className="relative mt-5 flex items-end justify-between">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-white/60">Shop</div>
                <div className="truncate text-sm font-semibold">Rahim Kirana Store</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-white/60">Health Score</div>
                <div className="font-display text-2xl font-bold leading-none">
                  {score}<span className="text-xs font-medium text-white/70">/100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {metricCards.map((c) => (
              <Card key={c.label} className="group relative overflow-hidden border border-border/50 p-4 shadow-lg transition-shadow duration-300 hover:shadow-xl hover:border-primary/20">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-muted-foreground">{c.label}</div>
                    <div className={`mt-2 text-xl font-bold tabular-nums sm:text-2xl ${c.tone}`}>{c.value}</div>
                  </div>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${c.bg} ${c.ring}`}>
                    <c.icon className={`h-4 w-4 ${c.tone}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border border-border/50 p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="h-3 w-3 rounded-full bg-[#3D52A0]" /> Health (30d)
              </div>
              <Badge variant="outline" className="text-[10px]">{score}/100</Badge>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={28} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="score" stroke="#3D52A0" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border border-border/50 p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="h-3 w-3 rounded-full bg-[#3D52A0]" /> Net Revenue (30d)
              </div>
              <Badge variant="outline" className="text-[10px]">{fmtBDT(netProfit30)}</Badge>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} width={36} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="net" fill="#3D52A0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden border border-border/50 shadow-lg">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Transaction History</div>
                <div className="text-[11px] text-muted-foreground">Recent transactions</div>
              </div>
              <Badge variant="outline" className="text-[10px]">{recent.length}</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Payment</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => {
                    const isSale = r.type === "sale";
                    const isExp = r.type === "expense";
                    return (
                      <tr key={i} className={`border-t border-border/40 ${isSale ? "bg-success/5" : isExp ? "bg-destructive/5" : ""}`}>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className={`text-[10px] ${isSale ? "border-success/40 text-success" : isExp ? "border-destructive/40 text-destructive" : ""}`}>
                            {r.type}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{r.payment_type}</td>
                        <td className="px-3 py-2 text-xs">{r.txn_date}</td>
                        <td className={`px-3 py-2 text-right font-semibold tabular-nums ${isExp ? "text-destructive" : "text-success"}`}>
                          {fmtBDT(Number(r.total_amount))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border border-border/50 border-l-4 border-l-[#3D52A0] bg-gradient-to-br from-[#3D52A0]/5 to-transparent p-5 shadow-lg">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-pulse text-[#3D52A0]" />
              <span className="font-display text-sm font-semibold text-[#3D52A0]">AI Summary (Sample)</span>
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
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your shop is trending positively with steady cash sales and healthy margins. Outstanding baki is manageable. Keep digitizing receipts daily to unlock investor-ready insights.
            </p>
          </Card>
        </div>

        <div className="flex justify-center pt-4">
          <Link to="/auth">
            <Button size="lg" className="rounded-full bg-[#3D52A0] hover:bg-[#3D52A0]/90">
              Create your real account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}