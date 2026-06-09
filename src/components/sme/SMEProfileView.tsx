import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import {
  type ShopProfile,
  publicAssetUrl,
  defaultCoverForCategory,
  categoryLogoGradient,
  fundingProgressPct,
  formatBDT,
} from "@/lib/shopProfile";
import { useI18n } from "@/lib/i18n";

function riskTone(r: ShopProfile["risk_level"]) {
  if (r === "low") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (r === "high") return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
  return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
}

export function SMEProfileView({
  shop,
  coverUrlOverride,
  logoUrlOverride,
}: {
  shop: ShopProfile;
  coverUrlOverride?: string | null;
  logoUrlOverride?: string | null;
}) {
  const { t } = useI18n();
  const cover = coverUrlOverride ?? publicAssetUrl(shop.cover_path) ?? defaultCoverForCategory(shop.category);
  const logo = logoUrlOverride ?? publicAssetUrl(shop.logo_path);
  const logoGradient = categoryLogoGradient(shop.category);
  const pct = fundingProgressPct(shop);
  const social = shop.social_links || {};

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/60">
        <div className="relative aspect-[16/5] w-full bg-muted">
          <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
          {/* Logo overlaid on top of the cover, fully visible */}
          <div className="absolute left-4 top-4 z-10 h-20 w-20 overflow-hidden rounded-2xl border-4 border-background bg-card shadow-lg sm:left-5 sm:h-24 sm:w-24">
            {logo ? (
              <img src={logo} alt={shop.name} className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${logoGradient} text-2xl font-semibold text-primary`}>
                {shop.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
        <div className="px-5 pb-5 pt-5 sm:px-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{shop.name}</h1>
              {shop.verified && (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3 w-3" /> {t("verified")}
                </Badge>
              )}
              {shop.risk_level && (
                <Badge className={riskTone(shop.risk_level)}>
                  {t(`risk_${shop.risk_level}`)} {t("risk_suffix")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {shop.category ?? t("uncategorized")}
              {shop.address ? ` · ${shop.address}` : ""}
            </p>
            {shop.owner_display_name && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("owner_prefix")}: {shop.owner_display_name}
              </p>
            )}
          </div>

          {shop.description && (
            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              {shop.description}
            </p>
          )}

          {shop.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {shop.tags.map((tg) => (
                <Badge key={tg} variant="outline" className="text-xs">
                  {tg}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      {shop.funding_goal ? (
        <Card className="p-5">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-medium text-muted-foreground">{t("funding_progress")}</h2>
            <span className="text-xs text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
          <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
            <span className="font-semibold">{formatBDT(shop.current_funding)}</span>
            <span className="text-muted-foreground">{t("raised_of")} {formatBDT(shop.funding_goal)}</span>
            {shop.roi_expectation && (
              <span className="ml-auto text-primary font-medium">
                {shop.roi_expectation}% {t("target_roi_short")}
              </span>
            )}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Wallet} label={t("monthly_revenue_label")} value={formatBDT(shop.monthly_revenue)} />
        <Stat icon={TrendingUp} label={t("target_roi_label")} value={shop.roi_expectation ? `${shop.roi_expectation}%` : "—"} />
        <Stat icon={Users} label={t("team_size_label")} value={shop.team_size?.toString() ?? "—"} />
        <Stat icon={Calendar} label={t("founded_label")} value={shop.founded_year?.toString() ?? "—"} />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">{t("contact_label")}</h2>
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          <ContactRow icon={MapPin} text={shop.address} />
          <ContactRow icon={Phone} text={shop.contact_phone} href={shop.contact_phone ? `tel:${shop.contact_phone}` : null} />
          <ContactRow icon={Mail} text={shop.contact_email} href={shop.contact_email ? `mailto:${shop.contact_email}` : null} />
          <ContactRow icon={Globe} text={shop.website} href={shop.website} />
        </div>
        {Object.keys(social).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(social).map(([k, v]) =>
              v ? (
                <a
                  key={k}
                  href={v}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs rounded-full border border-border/60 px-3 py-1 hover:bg-accent"
                >
                  {k}
                </a>
              ) : null,
            )}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">{t("business_details")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <Detail label={t("biz_category")} value={shop.category} icon={Briefcase} />
          <Detail
            label={t("biz_age")}
            value={shop.business_age_years ? `${shop.business_age_years} ${t("years_suffix")}` : null}
            icon={Calendar}
          />
          <Detail label={t("biz_trade_license")} value={shop.trade_license_no} icon={ShieldCheck} />
          <Detail
            label={t("biz_risk")}
            value={shop.risk_level ? t(`risk_${shop.risk_level}`) : null}
            icon={TrendingUp}
          />
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </Card>
  );
}

function ContactRow({ icon: Icon, text, href }: { icon: any; text: string | null; href?: string | null }) {
  if (!text) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground/70">
        <Icon className="h-4 w-4" />
        <span>—</span>
      </div>
    );
  }
  const inner = (
    <span className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="truncate">{text}</span>
    </span>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="hover:text-primary">
      {inner}
    </a>
  ) : (
    inner
  );
}

function Detail({ label, value, icon: Icon }: { label: string; value: string | null; icon: any }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value || "—"}</div>
      </div>
    </div>
  );
}
