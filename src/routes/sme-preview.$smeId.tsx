import { createFileRoute, Link, useParams, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DEMO_SMES } from "@/lib/demoSMEs";
import { demoSMEToShopProfile, demoSMEAssets } from "@/lib/demoSMEAdapter";
import { SMEProfileView } from "@/components/sme/SMEProfileView";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/sme-preview/$smeId")({
  component: SMEPreviewPage,
});

function SMEPreviewPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { smeId } = useParams({ from: "/sme-preview/$smeId" });
  const sme = DEMO_SMES.find((s) => s.id === smeId);

  if (!sme) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="text-sm">{t("sme_not_found")}</div>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← {t("back_to_home")}
        </Link>
      </div>
    );
  }

  const shop = demoSMEToShopProfile(sme);
  const { coverUrl, logoUrl } = demoSMEAssets(sme);

  return (
    <div className="mx-auto max-w-6xl space-y-3 p-4 sm:p-6">
      <button
        onClick={() => router.history.back()}
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-3.5 w-3.5" /> {t("back_to_dashboard")}
      </button>
      <SMEProfileView shop={shop} coverUrlOverride={coverUrl} logoUrlOverride={logoUrl} />
      <div className="flex justify-end">
        <Button className="rounded-full bg-gradient-primary text-white shadow">
          {t("card_view")}
        </Button>
      </div>
    </div>
  );
}
