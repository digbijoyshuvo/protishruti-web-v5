import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShopGate, useShop } from "@/components/ShopGate";
import { Sparkles, TrendingUp, ShieldAlert, Users, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/match-investors")({
  component: () => (
    <ShopGate>
      <MatchInvestorsPage />
    </ShopGate>
  ),
});

const CATEGORIES = ["SaaS", "FinTech", "E-commerce", "AgriTech", "Healthcare"] as const;
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

function MatchInvestorsPage() {
  const { shop } = useShop();
  const navigate = useNavigate();
  const [name, setName] = useState(shop?.name ?? "");
  const [category, setCategory] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [currentFunding, setCurrentFunding] = useState("");
  const [roiExpectation, setRoiExpectation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !region) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        sme_profile: {
          name,
          category,
          monthly_revenue: parseFloat(monthlyRevenue) || 0,
          current_funding: parseFloat(currentFunding) || 0,
          roi_expectation: parseFloat(roiExpectation) || 0,
          region,
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
      setResult(data);
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
        name,
        category,
        region,
        monthly_revenue: parseFloat(monthlyRevenue) || 0,
        current_funding: parseFloat(currentFunding) || 0,
        roi_expectation: parseFloat(roiExpectation) || 0,
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
            Powered by our matchmaker model
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          <Sparkles className="mr-1 h-3 w-3" /> Live
        </Badge>
      </div>

      <Card className="p-4">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>SME Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Monthly Revenue (BDT)</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Current Funding (BDT)</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={currentFunding}
              onChange={(e) => setCurrentFunding(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>ROI Expectation (%)</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={roiExpectation}
              onChange={(e) => setRoiExpectation(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Finding matches…" : "Find My Investors"}
            </Button>
          </div>
        </form>
      </Card>

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