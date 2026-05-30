import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ShopGate, useShop } from "@/components/ShopGate";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_INVESTORS, type DemoInvestor } from "@/lib/demoInvestors";
import { aiSummary } from "@/lib/ocr.functions";
import { useServerFn } from "@tanstack/react-start";
import { dayTotals, bakiOutstanding, healthScore, fmtBDT, type Txn } from "@/lib/calc";
import { categoryLabel } from "@/lib/categories";
import { toast } from "sonner";
import { Mail, Sparkles, Search } from "lucide-react";

export const Route = createFileRoute("/app/find-investor")({
  component: () => <ShopGate><FindInvestor /></ShopGate>,
});

function FindInvestor() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { shop } = useShop();
  const aiFn = useServerFn(aiSummary);
  const [investors, setInvestors] = useState<DemoInvestor[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DemoInvestor | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showDemoNote, setShowDemoNote] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("investor_profiles")
        .select("id,display_name,sectors,preferred_location,ticket_size_min,ticket_size_max,risk_tolerance,contact_email,notes");
      const real = (data ?? []) as any[];
      if (real.length === 0) {
        setInvestors(DEMO_INVESTORS);
        setShowDemoNote(true);
      } else {
        setInvestors([
          ...real.map((r) => ({ ...r, is_demo: false }) as DemoInvestor),
          ...DEMO_INVESTORS,
        ]);
        setShowDemoNote(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return investors;
    return investors.filter((i) =>
      `${i.display_name} ${i.preferred_location} ${i.sectors.join(" ")} ${i.notes ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [investors, search]);

  const generate = async (inv: DemoInvestor) => {
    if (!shop || !user) return;
    setSelected(inv);
    setGenerating(true);
    try {
      const { data: txData } = await supabase
        .from("transactions")
        .select("txn_date,total_amount,type,payment_type")
        .eq("shop_id", shop.id);
      const txns = (txData ?? []) as Txn[];
      const totals = dayTotals(txns);
      const baki = bakiOutstanding(txns);
      const { score } = healthScore({ txns, verified: false });

      const langLabel = lang === "bn" ? "Bangla" : "English";
      const prompt = `Write a concise, professional investor outreach email in ${langLabel} from a Bangladeshi SME owner to an investor.
SME details: shop="${shop.name}", category="${categoryLabel(shop.category, "en")}", address="${shop.address ?? "Bangladesh"}".
EXACT numbers (do not invent others): today_sales=${totals.sales} BDT, today_profit=${totals.profit} BDT, outstanding_baki=${baki} BDT, health_score=${score}/100.
Investor: name="${inv.display_name}", sectors=[${inv.sectors.join(", ")}], preferred_location="${inv.preferred_location}", ticket_range=${fmtBDT(inv.ticket_size_min)}-${fmtBDT(inv.ticket_size_max)}.
Output in this exact format:
Subject: <one-line subject>
Body:
<2-4 short paragraphs, mention the figures verbatim, end with a call to schedule a 15-min call>`;

      const r = await aiFn({
        data: { lang, goal: "investor outreach email", metrics: { prompt } },
      });
      const text = r.text || "";
      // Parse Subject / Body
      const sMatch = text.match(/Subject:\s*(.+)/i);
      const bMatch = text.match(/Body:\s*([\s\S]+)/i);
      const subj = sMatch ? sMatch[1].trim() : `Investment opportunity: ${shop.name}`;
      const bod = bMatch ? bMatch[1].trim() : text;
      setSubject(subj);
      setBody(bod);
    } catch (e: any) {
      toast.error(e.message ?? "AI failed");
    } finally {
      setGenerating(false);
    }
  };

  const send = async () => {
    if (!selected || !user || !shop) return;
    // Persist draft
    await supabase.from("document_drafts").insert({
      shop_id: shop.id,
      user_id: user.id,
      doc_type: "investor_pitch",
      title: `Pitch to ${selected.display_name}`,
      content: `To: ${selected.contact_email}\nSubject: ${subject}\n\n${body}`,
      meta: { investor_id: selected.id, investor_email: selected.contact_email },
    });
    const mailto = `mailto:${encodeURIComponent(selected.contact_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    toast.success(t("saved_ok"));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h2 className="font-display text-xl font-bold tracking-tight">{t("find_investor")}</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3D52A0]/20 bg-[#3D52A0]/10 px-3 py-1 text-xs font-medium text-[#3D52A0]">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          {lang === "bn" ? "এআই বিশ্লেষণ দ্বারা প্রস্তাবিত" : "Recommended by AI Analysis"}
        </span>
      </div>
      {showDemoNote && (
        <Card className="p-3 bg-accent/30 border-accent text-xs text-accent-foreground">
          {t("no_investors_real")}
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8" placeholder={t("search_smes")} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map((inv) => (
          <Card key={inv.id} className={`p-3 ${selected?.id === inv.id ? "border-primary" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm">{inv.display_name}</span>
                  {inv.is_demo && <Badge variant="secondary" className="text-[10px] py-0">{t("demo_badge")}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {inv.sectors.join(", ")} · {inv.preferred_location}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {fmtBDT(inv.ticket_size_min)} – {fmtBDT(inv.ticket_size_max)} · risk: {inv.risk_tolerance}
                </div>
                {inv.notes && <p className="text-xs mt-1 text-muted-foreground">{inv.notes}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => generate(inv)} disabled={generating}>
                <Sparkles className="h-3 w-3 mr-1" />
                {generating && selected?.id === inv.id ? "…" : t("generate_email")}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selected && (subject || body) && (
        <Card className="p-3 space-y-2 border-primary">
          <div className="text-xs text-muted-foreground">
            To: <span className="font-mono">{selected.contact_email}</span>
          </div>
          <div>
            <Label className="text-xs">{t("email_subject")}</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">{t("email_body")}</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="text-sm" />
          </div>
          <Button onClick={send} className="w-full">
            <Mail className="h-4 w-4 mr-1" />{t("send_email")}
          </Button>
        </Card>
      )}
    </div>
  );
}
