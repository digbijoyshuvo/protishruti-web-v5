import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, MapPin, TrendingUp, Wallet, X } from "lucide-react";
import { loadPrefs } from "@/lib/investorPrefs";

const API = "https://sme-matchmaker-backend.onrender.com";

type BackendSME = {
  id: string;
  name: string;
  category: string;
  region: string;
  monthly_revenue: number;
  current_funding: number;
  roi_expectation: number;
  risk_level: string;
};

type ScoredSME = BackendSME & { matchScore: number; reasons: string[] };

function scoreSMEForInvestor(s: BackendSME): ScoredSME {
  const prefs = loadPrefs();
  const reasons: string[] = [];
  let score = 40;

  if (prefs.categories.length === 0 || prefs.categories.includes(s.category as any)) {
    if (prefs.categories.includes(s.category as any)) {
      score += 30;
      reasons.push(`matches your ${s.category} interest`);
    }
  } else {
    score -= 20;
  }

  const risk = (s.risk_level || "").toLowerCase() as any;
  if (prefs.riskAppetite.includes(risk)) {
    score += 15;
    reasons.push(`${s.risk_level} risk fits your appetite`);
  } else {
    score -= 15;
  }

  if (s.roi_expectation >= prefs.minROI) {
    score += Math.min(20, Math.round(s.roi_expectation - prefs.minROI));
    if (s.roi_expectation >= 20) reasons.push(`high ROI of ${s.roi_expectation}%`);
  } else {
    score -= 10;
  }

  return {
    ...s,
    matchScore: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
  };
}

type Recommendation = {
  investor_name: string;
  match_percentage: number;
  risk_level: string;
  explanation: string[];
};

type RecommendResponse = {
  sme_id: string;
  sme_name: string;
  predicted_risk: string;
  recommendations: Recommendation[];
};

const riskTone = (r: string) => {
  const v = r.toLowerCase();
  if (v === "low") return "bg-success/15 text-success border-success/30";
  if (v === "medium") return "bg-warning/15 text-warning border-warning/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function BackendSMEs() {
  const [smes, setSmes] = useState<ScoredSME[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<BackendSME | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [rec, setRec] = useState<RecommendResponse | null>(null);
  const [recErr, setRecErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`${API}/smes`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: BackendSME[] = await res.json();
        const scored = data
          .map(scoreSMEForInvestor)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 5);
        if (!cancel) setSmes(scored);
      } catch (e: any) {
        if (!cancel) setErr(e?.message ?? "Failed to load SMEs");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const openSME = async (sme: BackendSME) => {
    setSelected(sme);
    setRec(null);
    setRecErr(null);
    setRecLoading(true);
    try {
      const res = await fetch(`${API}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sme_id: sme.id, top_n: 5 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RecommendResponse = await res.json();
      setRec(data);
    } catch (e: any) {
      setRecErr(e?.message ?? "Failed to load recommendations");
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <section id="ai-smes" className="scroll-mt-24 space-y-4">
      <div>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" /> AI-Matched SMEs
        </h2>
        <p className="text-sm text-muted-foreground">
          Top 5 SMEs from the matchmaker backend ranked against your investor preferences. Click a card for AI investor matches.
        </p>
      </div>

      {loading && (
        <Card className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading SMEs…
        </Card>
      )}

      {err && !loading && (
        <Card className="p-4 text-sm text-destructive">Failed to load SMEs: {err}</Card>
      )}

      {!loading && !err && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {smes.map((s) => (
            <button
              key={s.id}
              onClick={() => openSME(s)}
              className="group text-left"
            >
              <Card className="h-full space-y-3 border-border/60 p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{s.name}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {s.region}
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-primary text-primary-foreground">
                    {s.matchScore}% match
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="rounded-full">{s.category}</Badge>
                  <Badge variant="outline" className={`border ${riskTone(s.risk_level)}`}>
                    {s.risk_level} risk
                  </Badge>
                </div>
                {s.reasons.length > 0 && (
                  <ul className="ml-4 list-disc space-y-0.5 text-[11px] text-muted-foreground">
                    {s.reasons.slice(0, 2).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <div className="text-muted-foreground">Revenue</div>
                    <div className="font-semibold tabular-nums">{fmtUSD(s.monthly_revenue)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Funding</div>
                    <div className="font-semibold tabular-nums">{fmtUSD(s.current_funding)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">ROI</div>
                    <div className="font-semibold tabular-nums text-primary">{s.roi_expectation}%</div>
                  </div>
                </div>
                <div className="pt-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  View AI matches →
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-background shadow-elegant sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border/60 bg-background/95 p-4 backdrop-blur">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="truncate font-display text-lg font-bold">{selected.name}</h3>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{selected.category}</span>·<span>{selected.region}</span>·
                  <span className="inline-flex items-center gap-1"><Wallet className="h-3 w-3" />{fmtUSD(selected.current_funding)}</span>·
                  <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" />{selected.roi_expectation}%</span>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setSelected(null)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 p-4">
              {recLoading && (
                <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Running AI match…
                </div>
              )}
              {recErr && !recLoading && (
                <Card className="p-3 text-sm text-destructive">Failed: {recErr}</Card>
              )}
              {rec && !recLoading && (
                <>
                  <Card className="flex items-center justify-between border-primary/20 bg-primary/5 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Predicted Risk
                    </div>
                    <Badge variant="outline" className={`border ${riskTone(rec.predicted_risk)}`}>
                      {rec.predicted_risk}
                    </Badge>
                  </Card>

                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Top Investor Matches ({rec.recommendations.length})
                  </div>

                  {rec.recommendations.map((r, i) => (
                    <Card key={i} className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold">{r.investor_name}</div>
                        <Badge className="bg-primary text-primary-foreground">{r.match_percentage}%</Badge>
                      </div>
                      <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
                        {r.explanation.map((line, j) => (
                          <li key={j}>{line}</li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}