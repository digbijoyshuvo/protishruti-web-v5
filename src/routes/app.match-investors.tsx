import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShopGate, useShop } from "@/components/ShopGate";
import { Sparkles, TrendingUp, ShieldAlert, Users, UserCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/match-investors")({
  component: () => (
    <ShopGate>
      <MatchInvestorsPage />
    </ShopGate>
  ),
});

const REGIONS = ["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi"] as const;

type Recommendation = {
  investor_name: string;
  match_percentage: number;
  matching_explanations?: string[];
  explanation?: string[];
  risk_level?: string;
};

type ApiResponse = {
  predicted_risk: string;
  recommendations: Recommendation[];
};

const ENDPOINT = "https://sme-matchmaker-backend.onrender.com/recommend";

type ShopFull = {
  id: string;
  name: string | null;
  category: string | null;
  address: string | null;
  monthly_revenue: number | null;
  current_funding: number | null;
  roi_expectation: number | null;
};

function deriveRegion(address: string | null): string | null {
  if (!address) return null;
  const a = address.toLowerCase();
  for (const r of REGIONS) if (a.includes(r.toLowerCase())) return r;
  return null;
}

function MatchInvestorsPage() {
  const { shop } = useShop();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ShopFull | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user) return;
      setProfileLoading(true);
      const { data } = await supabase
        .from("shops")
        .select("id,name,category,address,monthly_revenue,current_funding,roi_expectation")
        .eq("owner_id", user.id)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (!cancel) {
        setProfile(data as ShopFull | null);
        setProfileLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [user?.id, shop?.id]);

  const region = deriveRegion(profile?.address ?? null);
  const missing: string[] = [];
  if (!profile?.name) missing.push("Business name");
  if (!profile?.category) missing.push("Category");
  if (!region) missing.push(`Region (address must include one of: ${REGIONS.join(", ")})`);
  if (profile?.monthly_revenue == null) missing.push("Monthly revenue");
  if (profile?.current_funding == null) missing.push("Current funding");
  if (profile?.roi_expectation == null) missing.push("ROI expectation");

  const runMatch = async () => {
    if (!profile || missing.length > 0) return;
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        sme_profile: {
          name: profile.name!,
          category: profile.category!,
          monthly_revenue: Number(profile.monthly_revenue) || 0,
          current_funding: Number(profile.current_funding) || 0,
          roi_expectation: Number(profile.roi_expectation) || 0,
          region: region!,
        },
        top_n: 5,
      };
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as ApiResponse;
      const sorted: ApiResponse = {
        ...data,
        recommendations: [...(data.recommendations ?? [])].sort(
          (a, b) => (b.match_percentage ?? 0) - (a.match_percentage ?? 0),
        ),
      };
      setResult(sorted);
      toast.success("Matches found");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to fetch recommendations");
    } finally {
      setLoading(false);
    }
  };

  const riskTone = (risk: string) => {
    const r = risk.toLowerCase();
    if (r.includes("low")) return "bg-success/10 text-success border-success/30";
    if (r.includes("high")) return "bg-destructive/10 text-destructive border-destructive/30";
    return "bg-warning/10 text-warning border-warning/40";
  };

  const matchTone = (pct: number) => {
    if (pct >= 80) return "bg-success text-success-foreground";
    if (pct >= 60) return "bg-primary text-primary-foreground";
    return "bg-muted text-foreground";
  };

  const viewInvestor = (rec: Recommendation) => {
    const slug = encodeURIComponent(rec.investor_name);
    const payload = {
      investor_name: rec.investor_name,
      match_percentage: rec.match_percentage,
      risk_level: rec.risk_level,
      explanation: rec.explanation ?? rec.matching_explanations ?? [],
      sme_context: {
        name: profile?.name ?? "",
        category: profile?.category ?? "",
        region: region ?? "",
        monthly_revenue: Number(profile?.monthly_revenue) || 0,
        current_funding: Number(profile?.current_funding) || 0,
        roi_expectation: Number(profile?.roi_expectation) || 0,
        predicted_risk: result?.predicted_risk,
      },
    };
    sessionStorage.setItem(`investor:${slug}`, JSON.stringify(payload));
    navigate({ to: "/app/investor-profile/$name", params: { name: slug } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            AI Investor Matching
          </h2>
          <p className="text-xs text-muted-foreground">
            Auto-filled from your business profile
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          <Sparkles className="mr-1 h-3 w-3" /> Live
        </Badge>
      </div>

      {profileLoading ? (
        <Card className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…
        </Card>
      ) : missing.length > 0 ? (
        <Card className="space-y-3 border-warning/40 bg-warning/5 p-4">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Complete your business profile</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            We use your business profile to find the best investor matches. Please add the
            following before running AI matching:
          </p>
          <ul className="ml-5 list-disc space-y-1 text-sm">
            {missing.map((m) => <li key={m}>{m}</li>)}
          </ul>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/app/profile">Go to Business Profile</Link>
          </Button>
        </Card>
      ) : (
        <Card className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><div className="text-xs text-muted-foreground">Name</div><div className="font-medium truncate">{profile!.name}</div></div>
            <div><div className="text-xs text-muted-foreground">Category</div><div className="font-medium">{profile!.category}</div></div>
            <div><div className="text-xs text-muted-foreground">Region</div><div className="font-medium">{region}</div></div>
            <div><div className="text-xs text-muted-foreground">Monthly Revenue</div><div className="font-medium tabular-nums">৳{Number(profile!.monthly_revenue).toLocaleString()}</div></div>
            <div><div className="text-xs text-muted-foreground">Current Funding</div><div className="font-medium tabular-nums">৳{Number(profile!.current_funding).toLocaleString()}</div></div>
            <div><div className="text-xs text-muted-foreground">ROI Expectation</div><div className="font-medium tabular-nums">{Number(profile!.roi_expectation)}%</div></div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={runMatch} disabled={loading} className="w-full sm:flex-1">
              {loading ? "Finding matches…" : "Find My Investors"}
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/app/profile">Edit profile</Link>
            </Button>
          </div>
        </Card>
      )}

      {result && (
        <div className="space-y-3 animate-fade-in-up">
          <Card className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Predicted Risk
                </div>
                <div className="font-display text-lg font-bold capitalize">
                  {result.predicted_risk}
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`border px-3 py-1 text-xs font-semibold capitalize ${riskTone(result.predicted_risk)}`}
            >
              {result.predicted_risk}
            </Badge>
          </Card>

          <div className="flex items-center gap-2 px-1">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-bold">
              Top Matching Investors
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {result.recommendations.map((rec, i) => (
              <Card key={`${rec.investor_name}-${i}`} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{rec.investor_name}</div>
                  <Badge className={`rounded-full ${matchTone(rec.match_percentage)}`}>
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {Math.round(rec.match_percentage)}% match
                  </Badge>
                </div>
                {(() => {
                  const lines = rec.explanation ?? rec.matching_explanations ?? [];
                  return lines.length > 0 ? (
                    <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
                      {lines.map((ex, j) => (
                        <li key={j}>{ex}</li>
                      ))}
                    </ul>
                  ) : null;
                })()}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => viewInvestor(rec)}
                >
                  <UserCircle2 className="mr-1 h-4 w-4" /> View investor profile
                </Button>
              </Card>
            ))}
            {result.recommendations.length === 0 && (
              <Card className="p-4 text-sm text-muted-foreground">
                No matching investors returned.
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}