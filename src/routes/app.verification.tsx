import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ShopGate, useShop } from "@/components/ShopGate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, Upload, Info } from "lucide-react";

export const Route = createFileRoute("/app/verification")({ component: () => <ShopGate><Verif /></ShopGate> });

function Verif() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { shop } = useShop();
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<any[]>([]);

  const load = () => shop && supabase.from("verification_results").select("*").eq("shop_id", shop.id).then(({ data }) => setItems(data ?? []));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [shop?.id]);

  const upload = async (file: File) => {
    if (!user || !shop) return;
    const path = `${user.id}/verif-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("scans").upload(path, file);
    if (error) { toast.error(error.message); return; }
    await supabase.from("verification_results").insert({ shop_id: shop.id, user_id: user.id, status: "pending", evidence: { path } });
    toast.success(t("pending_verification"));
    load();
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold px-1">{t("verification")}</h2>
      <Card className="p-4">
        <Button onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />{t("upload_kyc")}</Button>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </Card>
      {items.map((v) => (
        <Card key={v.id} className="p-3 flex items-center gap-3">
          <ShieldCheck className={`h-5 w-5 ${v.status === "approved" ? "text-success" : "text-muted-foreground"}`} />
          <div className="flex-1">
            <div className="text-sm font-medium">{t("status")}: {v.status}</div>
            <div className="text-xs text-muted-foreground">Score: {v.score}</div>
          </div>
        </Card>
      ))}

      <Card className="bg-slate-50 border-l-4 border-l-[#3D52A0] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3D52A0]/10">
            <Info className="h-4 w-4 text-[#3D52A0]" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-[#3D52A0]">
              {lang === "bn" ? "যাচাইকরণ প্রক্রিয়া কীভাবে কাজ করে?" : "How Verification Works"}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {lang === "bn"
                ? "আপনি যখন আপনার এসএমই কেওয়াইসি নথি (যেমন ট্রেড লাইসেন্স বা প্রশংসাপত্র) আপলোড করবেন, আমাদের নিরাপদ সিস্টেম স্বয়ংক্রিয় এআই এবং ওসিআর প্রযুক্তির মাধ্যমে অডিট পরিচালনা করে। এটি নথির সত্যতা, আর্থিক সূচক এবং ব্যবসায়িক পরিচয় যাচাই করে দ্রুত অডিট স্কোর প্রদান করে। সফল ভেরিফিকেশন এসএমইদের বিনিয়োগকারীদের সাথে সংযোগ স্থাপনের সম্ভাবনা বহুগুণ বৃদ্ধি করে।"
                : "When you upload your business KYC documents (like trade licenses or credentials), our secure system runs an automated AI & OCR audit. This verifies document authenticity, extracts key financial indexes, and audits business registration status to compute your verification score. Successfully verified profiles have significantly higher visibility to potential investors."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
