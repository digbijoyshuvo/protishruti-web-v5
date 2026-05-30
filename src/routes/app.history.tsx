import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { ShopGate, useShop } from "@/components/ShopGate";
import { supabase } from "@/integrations/supabase/client";
import { fmtBDT } from "@/lib/calc";

export const Route = createFileRoute("/app/history")({ component: () => <ShopGate><History /></ShopGate> });

function History() {
  const { t } = useI18n();
  const { shop } = useShop();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!shop) return;
    supabase.from("transactions").select("*").eq("shop_id", shop.id).order("txn_date", { ascending: false }).limit(100)
      .then(({ data }) => setRows(data ?? []));
  }, [shop?.id]);

  if (!rows.length) return <Card className="p-4 text-sm text-muted-foreground">{t("no_records")}</Card>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <Card key={r.id} className="p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{r.counterparty || t("walk_in")}</div>
            <div className="text-xs text-muted-foreground">{r.txn_date} · {t(r.type)} · {t(r.payment_type)}</div>
          </div>
          <div className={`font-semibold ${r.type === "expense" ? "text-destructive" : "text-success"}`}>{fmtBDT(Number(r.total_amount))}</div>
        </Card>
      ))}
    </div>
  );
}
