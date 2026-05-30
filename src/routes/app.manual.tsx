import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ShopGate, useShop } from "@/components/ShopGate";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { todayStr, fmtBDT } from "@/lib/calc";
import { toast } from "sonner";

export const Route = createFileRoute("/app/manual")({
  component: () => (
    <ShopGate>
      <ManualPage />
    </ShopGate>
  ),
});

type Item = { description: string; quantity: number; unit_price: number };

type Row = {
  txn_date: string;
  total_amount: number;
  type: "sale" | "expense" | "return";
  payment_type: "cash" | "credit" | "baki";
  counterparty: string;
  description: string;
  itemized: boolean;
  items: Item[];
};

const emptyItem = (): Item => ({ description: "", quantity: 1, unit_price: 0 });
const emptyRow = (): Row => ({
  txn_date: todayStr(),
  total_amount: 0,
  type: "sale",
  payment_type: "cash",
  counterparty: "",
  description: "",
  itemized: false,
  items: [emptyItem()],
});

const itemsTotal = (items: Item[]) =>
  items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);

function ManualPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { shop } = useShop();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((arr) => arr.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((arr) => [...arr, emptyRow()]);
  const removeRow = (i: number) => setRows((arr) => arr.filter((_, idx) => idx !== i));

  const updateItem = (rowIdx: number, itemIdx: number, patch: Partial<Item>) =>
    setRows((arr) =>
      arr.map((r, ri) =>
        ri !== rowIdx
          ? r
          : { ...r, items: r.items.map((it, ii) => (ii === itemIdx ? { ...it, ...patch } : it)) },
      ),
    );
  const addItem = (rowIdx: number) =>
    setRows((arr) =>
      arr.map((r, ri) => (ri === rowIdx ? { ...r, items: [...r.items, emptyItem()] } : r)),
    );
  const removeItem = (rowIdx: number, itemIdx: number) =>
    setRows((arr) =>
      arr.map((r, ri) =>
        ri !== rowIdx ? r : { ...r, items: r.items.filter((_, ii) => ii !== itemIdx) },
      ),
    );

  const save = async () => {
    if (!user || !shop) return;
    const prepared = rows.map((r) => ({
      ...r,
      total_amount: r.itemized ? itemsTotal(r.items) : Number(r.total_amount),
    }));
    const valid = prepared.filter((r) => r.total_amount > 0);
    if (!valid.length) {
      toast.error("Enter at least one record with an amount.");
      return;
    }
    setSaving(true);
    try {
      const payload = valid.map((r) => ({
        shop_id: shop.id,
        user_id: user.id,
        txn_date: r.txn_date,
        total_amount: r.total_amount,
        type: r.type,
        payment_type: r.payment_type,
        counterparty: r.counterparty || null,
        description: r.description || null,
        items: r.itemized
          ? r.items
              .filter((it) => Number(it.quantity) > 0 && Number(it.unit_price) > 0)
              .map((it) => ({
                description: it.description,
                quantity: Number(it.quantity),
                unit_price: Number(it.unit_price),
                amount: Number(it.quantity) * Number(it.unit_price),
              }))
          : [],
        validated: true,
        confidence_scores: { manual: 1 },
      }));
      const { error } = await supabase.from("transactions").insert(payload);
      if (error) throw error;
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "manual_entry",
        after: { count: payload.length },
      });
      toast.success(t("saved_ok"));
      navigate({ to: "/app" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold">{t("manual_entry")}</h2>
        <Link to="/app/upload" className="text-xs text-primary underline">
          {t("upload_scan")} →
        </Link>
      </div>
      <p className="px-1 text-xs text-muted-foreground">{t("scan_or_manual")}</p>

      {rows.map((r, i) => (
        <Card key={i} className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">#{i + 1}</span>
            {rows.length > 1 && (
              <button onClick={() => removeRow(i)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Date is its own row to avoid overlap on narrow screens */}
          <div className="min-w-0">
            <Label className="text-xs">{t("date")}</Label>
            <Input
              type="date"
              className="w-full"
              value={r.txn_date}
              onChange={(e) => update(i, { txn_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <Label className="text-xs">{t("txn_type")}</Label>
              <select
                className="w-full h-9 rounded-md border px-2 text-sm bg-background"
                value={r.type}
                onChange={(e) => update(i, { type: e.target.value as any })}
              >
                <option value="sale">{t("sale")}</option>
                <option value="expense">{t("expense")}</option>
                <option value="return">{t("return_txn")}</option>
              </select>
            </div>
            <div className="min-w-0">
              <Label className="text-xs">{t("payment_type")}</Label>
              <select
                className="w-full h-9 rounded-md border px-2 text-sm bg-background"
                value={r.payment_type}
                onChange={(e) => update(i, { payment_type: e.target.value as any })}
              >
                <option value="cash">{t("cash")}</option>
                <option value="credit">{t("credit")}</option>
                <option value="baki">{t("baki")}</option>
              </select>
            </div>
          </div>

          <div className="min-w-0">
            <Label className="text-xs">{t("counterparty")}</Label>
            <Input
              className="w-full"
              value={r.counterparty}
              onChange={(e) => update(i, { counterparty: e.target.value })}
              placeholder={t("walk_in")}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-2 py-2">
            <div className="text-xs">
              <div className="font-medium">{t("itemized_mode")}</div>
              <div className="text-muted-foreground">{t("itemized_help")}</div>
            </div>
            <Switch
              checked={r.itemized}
              onCheckedChange={(v) => update(i, { itemized: v })}
            />
          </div>

          {!r.itemized ? (
            <div className="min-w-0">
              <Label className="text-xs">{t("total_amount")}</Label>
              <Input
                type="number"
                inputMode="decimal"
                className="w-full"
                value={r.total_amount || ""}
                onChange={(e) => update(i, { total_amount: Number(e.target.value) })}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {r.items.map((it, ii) => (
                <div key={ii} className="rounded-md border p-2 space-y-2 bg-background">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {t("item")} #{ii + 1}
                    </span>
                    {r.items.length > 1 && (
                      <button
                        onClick={() => removeItem(i, ii)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="min-w-0">
                    <Label className="text-xs">{t("product_name")}</Label>
                    <Input
                      className="w-full"
                      value={it.description}
                      onChange={(e) => updateItem(i, ii, { description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0">
                      <Label className="text-xs">{t("quantity")}</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="w-full"
                        value={it.quantity || ""}
                        onChange={(e) =>
                          updateItem(i, ii, { quantity: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs">{t("unit_price")}</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="w-full"
                        value={it.unit_price || ""}
                        onChange={(e) =>
                          updateItem(i, ii, { unit_price: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    {t("line_total")}: {fmtBDT(Number(it.quantity || 0) * Number(it.unit_price || 0))}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => addItem(i)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> {t("add_item")}
              </Button>
              <div className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-2">
                <span className="text-xs font-medium">{t("total_amount")}</span>
                <span className="text-sm font-bold text-primary">
                  {fmtBDT(itemsTotal(r.items))}
                </span>
              </div>
            </div>
          )}
        </Card>
      ))}

      <Button variant="outline" className="w-full" onClick={addRow}>
        <Plus className="h-4 w-4 mr-1" /> {t("add_row")}
      </Button>
      <Button className="w-full" size="lg" disabled={saving} onClick={save}>
        {t("confirm_save")}
      </Button>
    </div>
  );
}
