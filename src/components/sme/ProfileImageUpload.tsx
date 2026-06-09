import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  uploadShopAsset,
  publicAssetUrl,
  defaultCoverForCategory,
  categoryLogoGradient,
} from "@/lib/shopProfile";
import { useI18n } from "@/lib/i18n";

type Props = {
  userId: string;
  shopId: string;
  kind: "logo" | "cover";
  currentPath: string | null;
  onUploaded: (path: string) => void;
  category?: string | null;
};

export function CoverImageUpload({ userId, shopId, currentPath, onUploaded }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const url = publicAssetUrl(currentPath) ?? DEFAULT_COVER;

  const onPick = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("logo_under_2mb"));
      return;
    }
    setBusy(true);
    try {
      const path = await uploadShopAsset({ userId, shopId, kind: "cover", file });
      onUploaded(path);
      toast.success(t("cover_updated"));
    } catch (e: any) {
      toast.error(e?.message ?? t("upload_failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-muted">
      <div className="aspect-[16/5] w-full">
        <img
          src={url}
          alt="Business cover"
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
      <div className="absolute bottom-3 right-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="shadow-md"
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
          {currentPath ? t("change_cover") : t("upload_cover_btn")}
        </Button>
      </div>
    </div>
  );
}

export function LogoUpload({ userId, shopId, currentPath, onUploaded }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const url = publicAssetUrl(currentPath);

  const onPick = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("logo_under_2mb"));
      return;
    }
    setBusy(true);
    try {
      const path = await uploadShopAsset({ userId, shopId, kind: "logo", file });
      onUploaded(path);
      toast.success(t("logo_updated"));
    } catch (e: any) {
      toast.error(e?.message ?? t("upload_failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="h-20 w-20 overflow-hidden rounded-2xl border border-border/60 bg-muted flex items-center justify-center">
        {url ? (
          <img src={url} alt="Logo" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
      />
      <Button size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        {currentPath ? t("replace_logo") : t("upload_logo_btn")}
      </Button>
    </div>
  );
}
