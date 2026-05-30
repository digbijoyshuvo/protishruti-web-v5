import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { ShopGate, useShop } from "@/components/ShopGate";
import { supabase } from "@/integrations/supabase/client";
import { dailySeries, type Txn, fmtBDT } from "@/lib/calc";
import { AlertTriangle, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/app/alerts")({ component: () => <ShopGate><Alerts /></ShopGate> });

function Alerts() {
  const { t } = useI18n();
  const { shop } = useShop();
  const [computed, setComputed] = useState<{ title: string; details: string; urgency: string }[]>([]);

  useEffect(() => {
    if (!shop) return;
    (async () => {
      const { data } = await supabase.from("transactions").select("txn_date,total_amount,type,payment_type").eq("shop_id", shop.id);
      const txns = (data ?? []) as Txn[];
      const series = dailySeries(txns, 14);
      const recent = series.slice(-7).reduce((a, b) => a + b.expenses, 0);
      const prev = series.slice(0, 7).reduce((a, b) => a + b.expenses, 0);
      const alerts: any[] = [];
      if (prev > 0 && recent > prev * 1.2) {
        alerts.push({ title: "Expenses rising", details: `Last 7 days: ${fmtBDT(recent)} vs prior 7 days: ${fmtBDT(prev)}. Consider renegotiating supplier rates.`, urgency: "high" });
      }
      const baki = txns.filter((tx) => tx.payment_type === "baki" && tx.type === "sale").reduce((a, b) => a + Number(b.total_amount), 0);
      const totalSales = txns.filter((tx) => tx.type === "sale").reduce((a, b) => a + Number(b.total_amount), 0);
      if (totalSales > 0 && baki / totalSales > 0.4) {
        alerts.push({ title: "High baki ratio", details: `${Math.round((baki/totalSales)*100)}% of sales are unpaid. Follow up with credit customers.`, urgency: "medium" });
      }
      setComputed(alerts);
    })();
  }, [shop?.id]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold px-1">{t("alerts")}</h2>
      {computed.length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">No active alerts.</Card>
      ) : computed.map((a, i) => (
        <Card key={i} className={`p-3 ${a.urgency === "high" ? "border-destructive" : "border-warning"}`}>
          <div className="flex items-start gap-2">
            {a.urgency === "high" ? <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" /> : <TrendingUp className="h-4 w-4 text-warning mt-0.5" />}
            <div className="flex-1">
              <div className="font-medium text-sm">{a.title}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{a.details}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
