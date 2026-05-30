import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ShopGate, useShop } from "@/components/ShopGate";
import { supabase } from "@/integrations/supabase/client";
import { aiSummary } from "@/lib/ocr.functions";
import { useServerFn } from "@tanstack/react-start";
import { dayTotals, bakiOutstanding, healthScore, type Txn } from "@/lib/calc";
import { toast } from "sonner";

export const Route = createFileRoute("/app/documents")({ component: () => <ShopGate><Docs /></ShopGate> });

function Docs() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { shop } = useShop();
  const [docs, setDocs] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const summaryFn = useServerFn(aiSummary);

  const load = () => shop && supabase.from("document_drafts").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false }).then(({ data }) => setDocs(data ?? []));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [shop?.id]);

  const generatePitch = async () => {
    if (!shop || !user) return;
    const { data: txData } = await supabase.from("transactions").select("txn_date,total_amount,type,payment_type").eq("shop_id", shop.id);
    const txns = (txData ?? []) as Txn[];
    const totals = dayTotals(txns);
    const baki = bakiOutstanding(txns);
    const { score } = healthScore({ txns, verified: false });
    const r = await summaryFn({ data: { lang, goal: "investor pitch email", metrics: { shop: shop.name, health: score, baki, today_sales: totals.sales, today_profit: totals.profit } } });
    setDraft(r.text);
  };

  const generateTradeLicense = async () => {
    if (!shop || !user) return;
    const content = `TRADE LICENSE APPLICATION\n\nShop Name: ${shop.name}\nAddress: ${shop.address ?? "—"}\nCategory: ${shop.category ?? "—"}\nOwner: ${user.email}\n\n(Fields marked auto-filled; please confirm before submission.)`;
    await supabase.from("document_drafts").insert({ shop_id: shop.id, user_id: user.id, doc_type: "trade_license", title: "Trade License Draft", content, generated_by_ai: false });
    toast.success(t("saved_ok"));
    load();
  };

  const savePitch = async () => {
    if (!shop || !user || !draft) return;
    await supabase.from("document_drafts").insert({ shop_id: shop.id, user_id: user.id, doc_type: "pitch_email", title: t("pitch_email"), content: draft });
    setDraft("");
    toast.success(t("saved_ok"));
    load();
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold px-1">{t("documents")}</h2>
      <Card className="p-3 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={generatePitch}>{t("generate_pitch")}</Button>
          <Button size="sm" variant="outline" onClick={generateTradeLicense}>{t("trade_license_form")}</Button>
        </div>
        {draft && (
          <>
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={8} className="text-sm" />
            <Button size="sm" onClick={savePitch}>{t("save")}</Button>
          </>
        )}
      </Card>
      {docs.map((d) => (
        <Card key={d.id} className="p-3">
          <div className="text-xs text-muted-foreground">{d.doc_type} · {new Date(d.created_at).toLocaleDateString()}</div>
          <div className="font-medium text-sm mt-0.5">{d.title}</div>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{d.content}</pre>
        </Card>
      ))}
    </div>
  );
}
