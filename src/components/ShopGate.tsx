import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CategorySelect } from "@/components/CategorySelect";
import { createContext, useContext, type ReactNode } from "react";

type Shop = { id: string; name: string; address: string | null; category: string | null };
const ShopCtx = createContext<{ shop: Shop | null; refresh: () => void }>({ shop: null, refresh: () => {} });
export const useShop = () => useContext(ShopCtx);

export function ShopGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("shops").select("id,name,address,category").eq("owner_id", user.id).order("created_at").limit(1).maybeSingle();
    setShop(data as Shop | null);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">…</div>;

  if (!shop) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-1">{t("edit_shop")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("hero_subtitle")}</p>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!user || !name.trim()) return;
              // Seed sensible investor-facing defaults so the new SME shows up
              // for investors immediately (owner can edit later in profile).
              const seed = {
                owner_id: user.id,
                name: name.trim(),
                address,
                category,
                owner_display_name: (user.user_metadata as any)?.full_name ?? user.email ?? null,
                funding_goal: 1000000,
                current_funding: 0,
                roi_expectation: 18,
                monthly_revenue: 150000,
                risk_level: "medium" as const,
                tags: category ? [category] : [],
              };
              const { data, error } = await supabase.from("shops").insert(seed).select().single();
              if (!error && data) setShop(data as Shop);
            }}
          >
            <div><Label>{t("shop_name")}</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>{t("address")}</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            <div><Label>{t("category")}</Label><CategorySelect value={category} onChange={setCategory} /></div>
            <Button type="submit" className="w-full">{t("save")}</Button>
          </form>
        </Card>
      </div>
    );
  }

  return <ShopCtx.Provider value={{ shop, refresh: load }}>{children}</ShopCtx.Provider>;
}
