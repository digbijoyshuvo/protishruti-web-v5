import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Camera,
  ShieldCheck,
  BarChart3,
  Handshake,
  FileCheck,
  Sparkles,
  ArrowRight,
  Cloud,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import logoUrl from "@/assets/protishruti-logo.png";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/app" });
  },
  component: Landing,
});

function useCountUp(target: number, durationMs = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return v;
}

function StatCard({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const n = useCountUp(value);
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card transition-all hover:shadow-elegant">
      <div className="font-display text-3xl font-bold tabular-nums text-[#3D52A0]">
        {n.toLocaleString()}{suffix ?? ""}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

const FEATURE_KEYS = [
  { icon: Camera, titleKey: "feat1_title", badgeKey: "feat1_badge", descKey: "feat1_desc" },
  { icon: ShieldCheck, titleKey: "feat2_title", badgeKey: "feat2_badge", descKey: "feat2_desc" },
  { icon: BarChart3, titleKey: "feat3_title", badgeKey: "feat3_badge", descKey: "feat3_desc" },
  { icon: Handshake, titleKey: "feat4_title", badgeKey: "feat4_badge", descKey: "feat4_desc" },
  { icon: FileCheck, titleKey: "feat5_title", badgeKey: "feat5_badge", descKey: "feat5_desc" },
];

function Landing() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app", replace: true });
  }, [loading, user, navigate]);

  const day = Math.floor(Date.now() / 86_400_000);
  const smes = 2480 + (day % 30) * 7;
  const txns = 184_500 + (day % 60) * 120;
  const investors = 142 + (day % 14);
  const matches = 318 + (day % 21) * 3;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-36">
          <Link to="/" className="flex items-center transition-transform duration-200 hover:scale-105">
            <img src={logoUrl} alt="Protishruti Analytics" className="h-20 w-auto object-contain lg:h-32" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LangToggle />
            <Link to="/auth">
              <Button variant="outline" size="sm" className="rounded-full border-[#3D52A0]/30 text-[#3D52A0] hover:bg-[#3D52A0]/5 hover:text-[#3D52A0]">
                {t("login")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Decorative glows */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#3D52A0]/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[420px] w-[420px] rounded-full bg-[#3D52A0]/5 blur-[120px]" />

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-16 lg:pt-14 lg:pb-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left column */}
          <div className="animate-fade-in-up lg:col-span-7">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#3D52A0]/20 bg-[#3D52A0]/5 px-3 py-1 text-xs font-medium text-[#3D52A0]">
              <Sparkles className="h-3.5 w-3.5" />
              {t("landing_badge")}
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {t("landing_hero_1")}{" "}
              <span className="bg-gradient-to-r from-[#3D52A0] to-[#202D62] bg-clip-text text-transparent">
                {t("landing_hero_2")}
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              {t("landing_hero_sub")}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/auth">
                <Button size="lg" className="rounded-full bg-gradient-to-r from-[#3D52A0] to-[#202D62] text-white shadow-elegant hover:opacity-95">
                  {t("landing_cta_start")} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="rounded-full border-[#3D52A0]/30 text-[#3D52A0] hover:bg-[#3D52A0]/5 hover:text-[#3D52A0]">
                  {t("landing_cta_demo")}
                </Button>
              </Link>
            </div>

            {/* Feature list */}
            <div className="mt-8 space-y-2.5">
              {FEATURE_KEYS.map((f, i) => {
                const isActive = active === i;
                return (
                  <button
                    type="button"
                    key={f.titleKey}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className={`group flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                      isActive
                        ? "border-[#3D52A0]/30 bg-[#3D52A0]/5 shadow-card"
                        : "border-border/60 bg-card hover:border-[#3D52A0]/20"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isActive ? "bg-[#3D52A0] text-white" : "bg-[#3D52A0]/10 text-[#3D52A0]"
                      }`}
                    >
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-semibold">{t(f.titleKey)}</span>
                        <span className="rounded-full bg-[#3D52A0]/10 px-2 py-0.5 text-[10px] font-medium text-[#3D52A0]">
                          {t(f.badgeKey)}
                        </span>
                      </div>
                      <p
                        className={`mt-1 text-xs leading-relaxed text-muted-foreground ${
                          isActive ? "" : "line-clamp-1"
                        }`}
                      >
                        {t(f.descKey)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right column — mock dashboard */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <div className="rounded-[36px] bg-gradient-to-br from-[#3D52A0]/15 via-white to-[#202D62]/10 p-4 shadow-elegant ring-1 ring-[#3D52A0]/10">
                <div className="rounded-3xl bg-white p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        SME Live Workspace
                      </div>
                      <div className="font-display text-sm font-bold">Tawheed Grocery</div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-[#3D52A0]/10" />
                  </div>

                  {/* Account card */}
                  <div className="mt-3 rounded-2xl bg-gradient-to-r from-[#3D52A0] to-[#202D62] p-4 text-white shadow-md">
                    <div className="flex items-center justify-between text-[10px] opacity-80">
                      <span>CloudCash SME Account</span>
                      <Cloud className="h-3.5 w-3.5" />
                    </div>
                    <div className="mt-2 font-display text-2xl font-bold tracking-tight">৳2,48,500</div>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] opacity-90">
                      <Camera className="h-3 w-3" />
                      AI Digital Ledger & Handwritten OCR Scan
                    </div>
                  </div>

                  {/* 2x2 grid */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { i: ShieldCheck, n: "Feature 2", cat: "Trust", t: "NID Verified" },
                      { i: BarChart3, n: "Feature 3", cat: "Insights", t: "Business IQ" },
                      { i: Handshake, n: "Feature 4", cat: "Capital", t: "Matchmaking" },
                      { i: FileCheck, n: "Feature 5", cat: "Compliance", t: "1-Click Forms" },
                    ].map((c) => (
                      <div key={c.n} className="rounded-xl border border-border/60 bg-white p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-[#3D52A0]/10 px-1.5 py-0.5 text-[8px] font-semibold text-[#3D52A0]">
                            {c.n}
                          </span>
                          <c.i className="h-3.5 w-3.5 text-[#3D52A0]" />
                        </div>
                        <div className="mt-1.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                          {c.cat}
                        </div>
                        <div className="text-[11px] font-semibold leading-tight">{c.t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative border-t border-border/50 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {t("landing_stats_title")}
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3D52A0]/20 bg-[#3D52A0]/5 px-3 py-1 text-xs font-medium text-[#3D52A0]">
              <TrendingUp className="h-3 w-3" /> {t("landing_live")}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard value={smes} suffix="+" label={t("landing_stat_smes")} />
            <StatCard value={txns} label={t("landing_stat_txns")} />
            <StatCard value={investors} suffix="+" label={t("landing_stat_investors")} />
            <StatCard value={matches} label={t("landing_stat_matches")} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:px-6 py-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <img src={logoUrl} alt="Protishruti Analytics" className="h-12 w-auto object-contain" />
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-[#3D52A0]">{t("landing_footer_terms")}</a>
            <a href="#" className="hover:text-[#3D52A0]">{t("landing_footer_privacy")}</a>
            <a href="#" className="hover:text-[#3D52A0]">{t("landing_footer_guide")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
