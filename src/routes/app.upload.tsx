import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Upload as UploadIcon, Loader2, PencilLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { ShopGate, useShop } from "@/components/ShopGate";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ocrExtract } from "@/lib/ocr.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/app/upload")({ component: () => <ShopGate><UploadPage /></ShopGate> });

async function compressImage(file: File, maxW = 1280, quality = 0.7): Promise<{ blob: Blob; dataUrl: string }> {
  const img = document.createElement("img");
  const url = URL.createObjectURL(file);
  await new Promise((r, e) => { img.onload = r; img.onerror = e; img.src = url; });
  const scale = Math.min(1, maxW / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = img.width * scale; canvas.height = img.height * scale;
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const blob = await (await fetch(dataUrl)).blob();
  return { blob, dataUrl };
}

function UploadPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { shop } = useShop();
  const navigate = useNavigate();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const ocr = useServerFn(ocrExtract);

  const handleFile = async (file: File) => {
    if (!user || !shop) return;
    setBusy(true);
    try {
      setStatus("Compressing…");
      const { blob, dataUrl } = await compressImage(file);
      setPreview(dataUrl);

      setStatus("Uploading…");
      const path = `${user.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("scans").upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const { data: upRow, error: upInsertErr } = await supabase
        .from("uploads")
        .insert({ shop_id: shop.id, user_id: user.id, image_path: path, status: "processing" })
        .select().single();
      if (upInsertErr) throw upInsertErr;

      setStatus(t("processing"));
      const result = await ocr({ data: { imageDataUrl: dataUrl } });

      await supabase.from("uploads").update({
        raw_ocr: result.raw_text,
        ocr_language: result.language,
        model_version: "gemini-2.5-flash",
        confidence_map: { transactions: result.transactions.map((tx: any) => tx.confidence_scores) },
        status: "extracted",
      }).eq("id", upRow.id);

      await supabase.from("audit_logs").insert({
        user_id: user.id, upload_id: upRow.id, action: "ocr_extracted",
        after: { transactions_count: result.transactions.length },
      });

      // Stash result for review page (avoid extra fetch)
      sessionStorage.setItem(`upload:${upRow.id}`, JSON.stringify(result));
      navigate({ to: "/app/review/$uploadId", params: { uploadId: upRow.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
      setBusy(false);
      setStatus("");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-1">{t("upload_scan")}</h2>
        <p className="text-xs text-muted-foreground mb-4">{t("guide_overlay")}</p>

        {preview ? (
          <div className="relative rounded-lg overflow-hidden border">
            <img src={preview} alt="preview" className="w-full" />
            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm">{status}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[4/5] rounded-lg border-2 border-dashed border-primary/40 bg-secondary/30 flex flex-col items-center justify-center text-muted-foreground">
            <Camera className="h-10 w-10 text-primary/60 mb-2" />
            <p className="text-xs px-4 text-center">{t("guide_overlay")}</p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="lg" disabled={busy} onClick={() => cameraRef.current?.click()}>
            <Camera className="mr-2 h-4 w-4" />{t("take_photo")}
          </Button>
          <Button size="lg" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
            <UploadIcon className="mr-2 h-4 w-4" />{t("upload_image")}
          </Button>
        </div>
        <Link to="/app/manual" className="mt-2 block">
          <Button size="lg" variant="secondary" className="w-full" disabled={busy}>
            <PencilLine className="mr-2 h-4 w-4" />{t("add_manually")}
          </Button>
        </Link>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </Card>
    </div>
  );
}
