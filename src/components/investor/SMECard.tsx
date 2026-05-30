import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, TrendingUp, Users, Sparkles, ShieldCheck, Flame } from "lucide-react";
import { type DemoSME, fundingProgress, formatBDT } from "@/lib/demoSMEs";
import { categoryLabel } from "@/lib/categories";
import { useI18n } from "@/lib/i18n";

type Props = {
  sme: DemoSME & { score?: number; reason?: string };
  highlight?: string;
  onView?: (sme: DemoSME) => void;
};

const riskTone: Record<DemoSME["riskLevel"], string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/40",
  high: "bg-destructive/10 text-destructive border-destructive/30",
};

function highlightText(text: string, term?: string) {
  if (!term) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-primary/15 px-0.5 text-primary">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </>
  );
}

export function SMECard({ sme, highlight, onView }: Props) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const progress = useMemo(() => fundingProgress(sme), [sme]);
  const riskLabel = t(`risk_${sme.riskLevel}`);

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-border/60 bg-gradient-to-br from-white to-muted/30 p-0 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={sme.image}
          alt={sme.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {sme.featured && (
            <Badge className="border-0 bg-primary text-primary-foreground shadow">
              <Sparkles className="mr-1 h-3 w-3" /> {t("card_featured")}
            </Badge>
          )}
          {sme.trending && (
            <Badge className="border-0 bg-orange-500/90 text-white shadow">
              <Flame className="mr-1 h-3 w-3" /> {t("card_trending")}
            </Badge>
          )}
        </div>
        <Badge
          variant="outline"
          className={`absolute right-3 top-3 backdrop-blur ${riskTone[sme.riskLevel]} border`}
        >
          <ShieldCheck className="mr-1 h-3 w-3" /> {riskLabel} {t("risk_suffix")}
        </Badge>
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <div className="text-xs font-medium text-white/90">{categoryLabel(sme.category, lang)}</div>
          {typeof sme.score === "number" && (
            <div className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-primary shadow">
              {sme.score}% {t("card_match")}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-base font-bold leading-tight">
            {highlightText(sme.name, highlight)}
          </h3>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {highlightText(sme.location, highlight)}
          </div>
        </div>

        <p className="line-clamp-2 text-xs text-muted-foreground">
          {highlightText(sme.description, highlight)}
        </p>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-2.5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("card_roi")}</div>
            <div className="flex items-center gap-1 text-sm font-bold text-success">
              <TrendingUp className="h-3 w-3" /> {sme.roi}%
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("card_revenue")}</div>
            <div className="text-sm font-bold text-foreground">{formatBDT(sme.monthlyRevenue)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("card_backers")}</div>
            <div className="flex items-center gap-1 text-sm font-bold text-foreground">
              <Users className="h-3 w-3" /> {sme.investorsCount}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="font-medium text-foreground">
              {formatBDT(sme.currentInvestment)}{" "}
              <span className="text-muted-foreground">/ {formatBDT(sme.fundingGoal)}</span>
            </span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {sme.reason && (
          <div className="rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-1.5 text-[11px] text-primary">
            <Sparkles className="mr-1 inline h-3 w-3" /> {sme.reason}
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-1">
          {sme.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>

        <Button
          size="sm"
          className="mt-1 w-full rounded-full bg-gradient-primary text-white shadow hover:opacity-95"
          onClick={() => {
            if (onView) onView(sme);
            else navigate({ to: "/sme-preview/$smeId", params: { smeId: sme.id } });
          }}
        >
          {t("card_view")}
        </Button>
      </div>
    </Card>
  );
}

export function SMECardSkeleton() {
  return (
    <Card className="overflow-hidden p-0 shadow-card">
      <div className="h-40 w-full animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted/70" />
        <div className="h-2 w-full animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded-full bg-muted" />
      </div>
    </Card>
  );
}
