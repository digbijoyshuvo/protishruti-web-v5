import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SMEProfileView } from "@/components/sme/SMEProfileView";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { ShopProfile } from "@/lib/shopProfile";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/app/sme/$shopId")({
  component: SMEProfilePage,
  errorComponent: ({ error, reset }) => <ErrorBox message={error.message} reset={reset} />,
  notFoundComponent: () => <NotFoundBox />,
});

function ErrorBox({ message, reset }: { message: string; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="p-6 text-sm text-destructive">
      {t("failed_to_load")}: {message}
      <Button size="sm" variant="outline" className="ml-3" onClick={reset}>
        {t("retry")}
      </Button>
    </div>
  );
}

function NotFoundBox() {
  const { t } = useI18n();
  return <div className="p-6 text-sm">{t("sme_not_found")}</div>;
}

function SMEProfilePage() {
  const { t } = useI18n();
  const { shopId } = useParams({ from: "/app/sme/$shopId" });
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setShop({
            ...data,
            social_links: (data.social_links ?? {}) as Record<string, string>,
            tags: (data.tags ?? []) as string[],
            current_funding: Number(data.current_funding ?? 0),
          } as ShopProfile);
        }
        setLoading(false);
      });
  }, [shopId]);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{t("loading")}</div>;
  if (!shop) return <div className="p-6 text-sm">{t("sme_not_found")}</div>;

  return (
    <div className="space-y-3">
      <Link to="/app" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-3.5 w-3.5" /> {t("back_to_dashboard")}
      </Link>
      <SMEProfileView shop={shop} />
    </div>
  );
}
