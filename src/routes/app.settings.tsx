import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n, type Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CategorySelect } from "@/components/CategorySelect";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { user, roles } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const activeRole: "sme" | "investor" = roles.includes("investor") ? "investor" : "sme";

  useEffect(() => {
    if (!user) return;
    supabase.from("shops").select("*").eq("owner_id", user.id).maybeSingle().then(({ data }) => setShop(data));
  }, [user?.id]);

  const save = async () => {
    if (!shop) return;
    const { error } = await supabase.from("shops").update({
      name: shop.name, address: shop.address, category: shop.category,
      contact_phone: shop.contact_phone, contact_email: shop.contact_email,
      trade_license_no: shop.trade_license_no, owner_nid: shop.owner_nid,
    }).eq("id", shop.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("saved_ok"));
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold px-1">{t("settings")}</h2>
      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t("language")}</Label>
          <div className="flex gap-1">
            {(["bn", "en"] as Lang[]).map((l) => (
              <Button key={l} size="sm" variant={lang === l ? "default" : "outline"} onClick={() => setLang(l)}>{l === "bn" ? "বাংলা" : "EN"}</Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <Label>Account type</Label>
            <p className="text-xs text-muted-foreground">Set at signup — contact support to change</p>
          </div>
          <Badge variant="secondary">{activeRole === "investor" ? "Investor" : "SME Owner"}</Badge>
        </div>
      </Card>





      {shop && (
        <Card className="p-4 space-y-2">
          <h3 className="font-medium">{t("edit_shop")}</h3>
          <div><Label>{t("shop_name")}</Label><Input value={shop.name ?? ""} onChange={(e) => setShop({ ...shop, name: e.target.value })} /></div>
          <div><Label>{t("address")}</Label><Input value={shop.address ?? ""} onChange={(e) => setShop({ ...shop, address: e.target.value })} /></div>
          <div><Label>{t("category")}</Label><CategorySelect value={shop.category ?? ""} onChange={(v) => setShop({ ...shop, category: v })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Trade License</Label><Input value={shop.trade_license_no ?? ""} onChange={(e) => setShop({ ...shop, trade_license_no: e.target.value })} /></div>
            <div><Label>NID</Label><Input value={shop.owner_nid ?? ""} onChange={(e) => setShop({ ...shop, owner_nid: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>{t("phone")}</Label><Input value={shop.contact_phone ?? ""} onChange={(e) => setShop({ ...shop, contact_phone: e.target.value })} /></div>
            <div><Label>{t("email")}</Label><Input value={shop.contact_email ?? ""} onChange={(e) => setShop({ ...shop, contact_email: e.target.value })} /></div>
          </div>
          <Button onClick={save}>{t("save")}</Button>
        </Card>
      )}
    </div>
  );
}
