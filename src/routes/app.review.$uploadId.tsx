import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ShopGate, useShop } from "@/components/ShopGate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/review/$uploadId")({ component: () => <ShopGate><Review /></ShopGate> });

type Draft = {
  txn_date: string;
  total_amount: number;
  type: "sale" | "expense" | "return";
  payment_type: "cash" | "credit" | "baki";
  counterparty: string;
  description: string;
  confidence_scores: Record<string, number>;
};

const LOW = 0.7;

function Review() {
  const { t } = useI18n();
  const { uploadId } = Route.useParams();
  const { user } = useAuth();
  const { shop } = useShop();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [rawText, setRawText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem(`upload:${uploadId}`);
    if (cached) {
      const r = JSON.parse(cached);
      setRawText(r.raw_text || "");
      const today = new Date().toISOString().slice(0, 10);
      setDrafts((r.transactions || []).map((tx: any) => ({
        txn_date: tx.date || today,
        total_amount: Number(tx.total_amount) || 0,
        type: tx.type || "sale",
        payment_type: tx.payment_type || "cash",
        counterparty: tx.counterparty || "",
        description: tx.description || "",
        confidence_scores: tx.confidence_scores || {},
      })));
    }
  }, [uploadId]);

  const allReviewed = drafts.every((d) =>
    d.total_amount > 0 &&
    Object.entries(d.confidence_scores).every(([_, v]) => (v as number) >= LOW)
  );

  const update = (i: number, patch: Partial<Draft>) => {
    setDrafts((arr) => arr.map((d, idx) => idx === i ? { ...d, ...patch, confidence_scores: { ...d.confidence_scores, ...Object.fromEntries(Object.keys(patch).map(k => [k, 1])) } } : d));
  };

  const save = async () => {
    if (!user || !shop) return;
    if (!allReviewed) { toast.error(t("low_confidence")); return; }
    setSaving(true);
    try {
      const rows = drafts.map((d) => ({
        upload_id: uploadId, shop_id: shop.id, user_id: user.id,
        txn_date: d.txn_date, total_amount: d.total_amount, type: d.type, payment_type: d.payment_type,
        counterparty: d.counterparty || null, description: d.description || null,
        confidence_scores: d.confidence_scores, validated: true,
      }));
      const { error } = await supabase.from("transactions").insert(rows);
      if (error) throw error;
      await supabase.from("uploads").update({ status: "validated" }).eq("id", uploadId);
      await supabase.from("audit_logs").insert({ user_id: user.id, upload_id: uploadId, action: "validated", after: { count: rows.length } });
      toast.success(t("saved_ok"));
      navigate({ to: "/app" });
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  if (drafts.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">{t("no_records")}</p>
        <Button variant="outline" className="mt-3" onClick={() => navigate({ to: "/app/upload" })}>{t("upload_scan")}</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold px-1">{t("review_records")}</h2>
      {drafts.map((d, i) => {
        const lowConf = Object.entries(d.confidence_scores).filter(([_, v]) => (v as number) < LOW).map(([k]) => k);
        return (
          <Card key={i} className={`p-3 ${lowConf.length ? "border-warning" : ""}`}>
            {lowConf.length > 0 && (
              <div className="mb-2 flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-1 text-xs text-warning-foreground">
                <AlertTriangle className="h-3 w-3" /> {t("low_confidence")}: {lowConf.join(", ")}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">{t("date")}</Label>
                <Input type="date" value={d.txn_date} onChange={(e) => update(i, { txn_date: e.target.value })} /></div>
              <div><Label className="text-xs">{t("total_amount")}</Label>
                <Input type="number" inputMode="decimal" value={d.total_amount} onChange={(e) => update(i, { total_amount: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">{t("txn_type")}</Label>
                <select className="w-full h-9 rounded-md border px-2 text-sm" value={d.type} onChange={(e) => update(i, { type: e.target.value as any })}>
                  <option value="sale">{t("sale")}</option><option value="expense">{t("expense")}</option><option value="return">{t("return_txn")}</option>
                </select>
              </div>
              <div><Label className="text-xs">{t("payment_type")}</Label>
                <select className="w-full h-9 rounded-md border px-2 text-sm" value={d.payment_type} onChange={(e) => update(i, { payment_type: e.target.value as any })}>
                  <option value="cash">{t("cash")}</option><option value="credit">{t("credit")}</option><option value="baki">{t("baki")}</option>
                </select>
              </div>
              <div className="col-span-2"><Label className="text-xs">{t("counterparty")}</Label>
                <Input value={d.counterparty} onChange={(e) => update(i, { counterparty: e.target.value })} placeholder={t("walk_in")} /></div>
            </div>
          </Card>
        );
      })}
      <Button className="w-full" size="lg" disabled={!allReviewed || saving} onClick={save}>{t("confirm_save")}</Button>
      {rawText && (
        <details className="text-xs text-muted-foreground"><summary>raw OCR</summary><pre className="whitespace-pre-wrap mt-2">{rawText}</pre></details>
      )}
    </div>
  );
}
