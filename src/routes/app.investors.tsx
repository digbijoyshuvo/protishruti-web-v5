import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/investors")({ component: InvestorsPage });

function InvestorsPage() {
  const { t, lang } = useI18n();
  const { user, roles } = useAuth();
  const isInvestor = roles.includes("investor");
  const [prof, setProf] = useState<any>({ display_name: "", sectors: "", preferred_location: "", min_monthly_revenue: 0, ticket_size_min: 0, ticket_size_max: 0, risk_tolerance: "medium" });
  const [matches, setMatches] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    if (isInvestor) {
      supabase.from("investor_profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) setProf({ ...data, sectors: (data.sectors ?? []).join(",") });
      });
    } else {
      supabase.from("investor_profiles").select("*").then(({ data }) => setInvestors(data ?? []));
    }
  }, [user?.id, isInvestor]);

  const loadMatches = async () => {
    if (!prof.display_name) return;
    const { data } = await supabase.from("shops").select("*");
    const ranked = (data ?? []).map((s: any) => {
      let score = 50;
      if (prof.preferred_location && s.address?.toLowerCase().includes(prof.preferred_location.toLowerCase())) score += 20;
      const sectors = String(prof.sectors).split(",").map((x: string) => x.trim().toLowerCase()).filter(Boolean);
      if (sectors.length && sectors.some((sec: string) => (s.category ?? "").toLowerCase().includes(sec))) score += 20;
      if (s.verified) score += 10;
      return { ...s, match: Math.min(100, score) };
    }).sort((a: any, b: any) => b.match - a.match);
    setMatches(ranked);
  };
  useEffect(() => { if (isInvestor) loadMatches(); /* eslint-disable-next-line */ }, [prof, isInvestor]);

  const saveProfile = async () => {
    if (!user) return;
    const payload = {
      user_id: user.id, display_name: prof.display_name, preferred_location: prof.preferred_location,
      sectors: String(prof.sectors).split(",").map((s: string) => s.trim()).filter(Boolean),
      min_monthly_revenue: Number(prof.min_monthly_revenue) || 0,
      ticket_size_min: Number(prof.ticket_size_min) || 0,
      ticket_size_max: Number(prof.ticket_size_max) || 0,
      risk_tolerance: prof.risk_tolerance,
    };
    const { error } = await supabase.from("investor_profiles").upsert(payload, { onConflict: "user_id" });
    if (error) { toast.error(error.message); return; }
    toast.success(t("saved_ok"));
  };

  if (isInvestor) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="font-display text-xl font-bold tracking-tight">{t("investor_prefs")}</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3D52A0]/20 bg-[#3D52A0]/10 px-3 py-1 text-xs font-medium text-[#3D52A0]">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            {lang === "bn" ? "এআই বিশ্লেষণ দ্বারা প্রস্তাবিত" : "Recommended by AI Analysis"}
          </span>
        </div>
        <Card className="p-4 space-y-2">
          <div><Label>{t("full_name")}</Label><Input value={prof.display_name} onChange={(e) => setProf({ ...prof, display_name: e.target.value })} /></div>
          <div><Label>{t("sectors")}</Label><Input value={prof.sectors} onChange={(e) => setProf({ ...prof, sectors: e.target.value })} placeholder="kirana, vegetable" /></div>
          <div><Label>{t("preferred_location")}</Label><Input value={prof.preferred_location} onChange={(e) => setProf({ ...prof, preferred_location: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>{t("min_revenue")}</Label><Input type="number" value={prof.min_monthly_revenue} onChange={(e) => setProf({ ...prof, min_monthly_revenue: e.target.value })} /></div>
            <div><Label>{t("risk_tol")}</Label>
              <select className="w-full h-9 rounded-md border px-2 text-sm" value={prof.risk_tolerance} onChange={(e) => setProf({ ...prof, risk_tolerance: e.target.value })}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select></div>
          </div>
          <Button onClick={saveProfile}>{t("save")}</Button>
        </Card>
        <h3 className="text-sm font-semibold px-1 pt-2">{t("matches")}</h3>
        {matches.map((m) => (
          <Card key={m.id} className="p-3 flex justify-between items-center">
            <div>
              <div className="font-medium text-sm">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.category ?? "—"} · {m.address ?? "—"}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">{t("match_score")}</div>
              <div className="font-bold text-primary">{m.match}</div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h2 className="font-display text-xl font-bold tracking-tight">{t("investors")}</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3D52A0]/20 bg-[#3D52A0]/10 px-3 py-1 text-xs font-medium text-[#3D52A0]">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          {lang === "bn" ? "এআই বিশ্লেষণ দ্বারা প্রস্তাবিত" : "Recommended by AI Analysis"}
        </span>
      </div>
      {investors.length === 0 && <Card className="p-4 text-sm text-muted-foreground">No investors yet.</Card>}
      {investors.map((i) => (
        <Card key={i.id} className="p-3 flex justify-between items-center">
          <div>
            <div className="font-medium text-sm">{i.display_name}</div>
            <div className="text-xs text-muted-foreground">{(i.sectors ?? []).join(", ") || "—"} · {i.preferred_location ?? "—"}</div>
          </div>
          <Button size="sm" variant="outline">{t("request_intro")}</Button>
        </Card>
      ))}
    </div>
  );
}
