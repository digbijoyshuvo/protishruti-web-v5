import { Link } from "@tanstack/react-router";
import { ShieldAlert, ShieldCheck, Loader2, ShieldX, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
import { useI18n } from "@/lib/i18n";

export function VerificationBanner() {
  const { verification, loading } = useIdentityVerification();
  const { t } = useI18n();
  if (loading || !verification) return null;
  if (verification.status === "verified") return null;

  const config = (() => {
    switch (verification.status) {
      case "processing":
        return {
          icon: Loader2,
          iconClass: "animate-spin text-[#3D52A0]",
          title: t("vb_progress_title"),
          body: t("vb_progress_body"),
          cta: t("vb_progress_cta"),
          tone: "border-l-[#3D52A0] bg-[#3D52A0]/5",
        };
      case "failed":
        return {
          icon: ShieldX,
          iconClass: "text-destructive",
          title: t("vb_failed_title"),
          body: verification.reason ?? t("vb_failed_body"),
          cta: t("vb_failed_cta"),
          tone: "border-l-destructive bg-destructive/5",
        };
      case "manual_review":
        return {
          icon: ShieldAlert,
          iconClass: "text-amber-600",
          title: t("vb_review_title"),
          body: verification.reason ?? t("vb_review_body"),
          cta: t("vb_review_cta"),
          tone: "border-l-amber-500 bg-amber-50",
        };
      default:
        return {
          icon: ShieldAlert,
          iconClass: "text-amber-600",
          title: t("vb_default_title"),
          body: t("vb_default_body"),
          cta: t("vb_default_cta"),
          tone: "border-l-amber-500 bg-amber-50",
        };
    }
  })();

  const Icon = config.icon;

  return (
    <Card className={`border-l-4 p-4 ${config.tone}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
          <Icon className={`h-5 w-5 ${config.iconClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{config.title}</h3>
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{config.body}</p>
          <Link to="/app/identity" className="mt-3 inline-block">
            <Button size="sm" className="bg-[#3D52A0] hover:bg-[#202D62]">
              {config.cta}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
