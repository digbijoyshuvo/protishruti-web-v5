import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Upload as UploadIcon, Loader2, ShieldCheck, ShieldX, RotateCcw, IdCard, UserCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { verifyIdentity } from "@/lib/identity.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const Route = createFileRoute("/app/identity")({ component: IdentityVerificationPage });

async function compressImage(file: File, maxW = 800, quality = 0.7): Promise<{ blob: Blob; dataUrl: string }> {
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

function IdentityVerificationPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { verification, loading, refresh, verified } = useIdentityVerification();
  const verifyFn = useServerFn(verifyIdentity);

  const [nid, setNid] = useState<{ blob: Blob; dataUrl: string } | null>(null);
  const [selfie, setSelfie] = useState<{ blob: Blob; dataUrl: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string>("");

  const nidRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const onPick = async (file: File, kind: "nid" | "selfie") => {
    try {
      const out = await compressImage(file, kind === "nid" ? 1000 : 720, 0.72);
      if (kind === "nid") setNid(out); else setSelfie(out);
    } catch {
      toast.error(t("id_read_error"));
    }
  };

  const submit = async () => {
    if (!user || !nid || !selfie || busy) return;
    setBusy(true);
    try {
      setStep(t("id_uploading"));
      const stamp = Date.now();
      const nidPath = `${user.id}/identity/nid-${stamp}.jpg`;
      const selfiePath = `${user.id}/identity/selfie-${stamp}.jpg`;
      const [n1, n2] = await Promise.all([
        supabase.storage.from("scans").upload(nidPath, nid.blob, { contentType: "image/jpeg", upsert: true }),
        supabase.storage.from("scans").upload(selfiePath, selfie.blob, { contentType: "image/jpeg", upsert: true }),
      ]);
      if (n1.error) throw n1.error;
      if (n2.error) throw n2.error;

      setStep(t("id_matching"));
      const result = await verifyFn({
        data: { nidDataUrl: nid.dataUrl, selfieDataUrl: selfie.dataUrl, nidPath, selfiePath },
      });

      if (result.status === "verified") {
        toast.success(t("id_success_toast"));
      } else {
        toast.error(result.reason ?? t("id_fail_toast"));
      }
      setNid(null);
      setSelfie(null);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? t("id_fail_toast"));
      await refresh();
    } finally {
      setBusy(false);
      setStep("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Status header */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold">{t("id_title")}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("id_intro")}
            </p>
          </div>
          {verified && <VerifiedBadge size="md" showLabel />}
        </div>

        <div className="mt-4 rounded-xl border bg-muted/30 p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{t("id_status_label")}</span>
            {verification?.status === "verified" && (
              <span className="inline-flex items-center gap-1 text-[#3D52A0]">
                <ShieldCheck className="h-3.5 w-3.5" /> {t("id_verified")}
              </span>
            )}
            {verification?.status === "processing" && (
              <span className="inline-flex items-center gap-1 text-[#3D52A0]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("id_processing")}
              </span>
            )}
            {verification?.status === "failed" && (
              <span className="inline-flex items-center gap-1 text-destructive">
                <ShieldX className="h-3.5 w-3.5" /> {t("id_failed")}
              </span>
            )}
            {verification?.status === "unverified" && (
              <span className="text-amber-700">{t("id_not_verified")}</span>
            )}
          </div>
          {verification?.match_score != null && (
            <div className="mt-1 text-muted-foreground">
              {t("id_match_conf")} <span className="font-semibold">{Math.round(verification.match_score * 100)}%</span>
            </div>
          )}
          {verification?.reason && verification.status !== "verified" && (
            <div className="mt-1 text-muted-foreground">{t("id_reason")} {verification.reason}</div>
          )}
          {verification?.attempts ? (
            <div className="mt-1 text-muted-foreground">{t("id_attempts")} {verification.attempts}</div>
          ) : null}
        </div>
      </Card>

      {/* Upload flow — hidden when verified */}
      {!verified && (
        <Card className="p-5">
          <ol className="space-y-5">
            {/* Step 1: NID */}
            <li>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <IdCard className="h-4 w-4 text-[#3D52A0]" /> {t("id_step1")}
              </div>
              {nid ? (
                <div className="relative overflow-hidden rounded-lg border">
                  <img src={nid.dataUrl} alt="NID preview" className="w-full" />
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-secondary/30 text-xs text-muted-foreground">
                  {t("id_nid_placeholder")}
                </div>
              )}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => nidRef.current?.click()}>
                  <UploadIcon className="mr-1.5 h-3.5 w-3.5" /> {nid ? t("id_replace_nid") : t("id_choose_photo")}
                </Button>
                <Button size="sm" variant="ghost" disabled={busy || !nid} onClick={() => setNid(null)}>
                  {t("remove")}
                </Button>
                <input
                  ref={nidRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0], "nid")}
                />
              </div>
            </li>

            {/* Step 2: Selfie */}
            <li>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <UserCircle2 className="h-4 w-4 text-[#3D52A0]" /> {t("id_step2")}
              </div>
              {selfie ? (
                <div className="relative mx-auto aspect-square w-48 overflow-hidden rounded-full border-4 border-[#3D52A0]/30">
                  <img src={selfie.dataUrl} alt="Selfie preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="mx-auto flex aspect-square w-48 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-secondary/30 text-xs text-muted-foreground">
                  {t("id_selfie_placeholder")}
                </div>
              )}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button size="sm" disabled={busy} onClick={() => selfieRef.current?.click()}>
                  <Camera className="mr-1.5 h-3.5 w-3.5" /> {selfie ? t("id_retake_selfie") : t("id_take_selfie")}
                </Button>
                <Button size="sm" variant="ghost" disabled={busy || !selfie} onClick={() => setSelfie(null)}>
                  {t("remove")}
                </Button>
                <input
                  ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden"
                  onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0], "selfie")}
                />
              </div>
            </li>
          </ol>

          <Button
            size="lg"
            className="mt-5 w-full bg-[#3D52A0] hover:bg-[#202D62]"
            disabled={!nid || !selfie || busy}
            onClick={submit}
          >
            {busy ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {step || t("id_verifying")}</>
            ) : verification?.status === "failed" ? (
              <><RotateCcw className="mr-2 h-4 w-4" /> {t("id_retry")}</>
            ) : (
              <><ShieldCheck className="mr-2 h-4 w-4" /> {t("id_start")}</>
            )}
          </Button>

          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            {t("id_privacy")}
          </p>
        </Card>
      )}

      {verified && (
        <Card className="border-l-4 border-l-[#3D52A0] bg-[#3D52A0]/5 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-[#3D52A0]" />
            <div>
              <h3 className="text-sm font-semibold">{t("id_done_title")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("id_done_sub")}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
