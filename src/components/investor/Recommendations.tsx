import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Settings2, Check } from "lucide-react";
import { SME_CATEGORIES, type DemoSME, type SMECategory, type RiskLevel } from "@/lib/demoSMEs";
import { loadPrefs, savePrefs, type InvestorPrefs } from "@/lib/investorPrefs";
import { recommendSMEs } from "@/lib/recommend";
import { SMECard } from "./SMECard";
import { useI18n } from "@/lib/i18n";
import { categoryLabel } from "@/lib/categories";

type Props = { smes: DemoSME[] };

const RISKS: RiskLevel[] = ["low", "medium", "high"];

export function Recommendations({ smes }: Props) {
  const { t, lang } = useI18n();
  const [prefs, setPrefs] = useState<InvestorPrefs>(() => loadPrefs());
  const [editing, setEditing] = useState(prefs.categories.length === 0);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const recommended = recommendSMEs(smes, prefs).slice(0, 6);

  const toggleCategory = (c: SMECategory) =>
    setPrefs((p) => ({
      ...p,
      categories: p.categories.includes(c)
        ? p.categories.filter((x) => x !== c)
        : [...p.categories, c],
    }));

  const toggleRisk = (r: RiskLevel) =>
    setPrefs((p) => ({
      ...p,
      riskAppetite: p.riskAppetite.includes(r)
        ? p.riskAppetite.filter((x) => x !== r)
        : [...p.riskAppetite, r],
    }));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("rec_title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("rec_sub")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditing((v) => !v)}
          className="rounded-full"
        >
          <Settings2 className="mr-1 h-4 w-4" />
          {editing ? t("rec_done") : t("rec_edit")}
        </Button>
      </div>

      {editing && (
        <Card className="animate-fade-in-up space-y-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("rec_sectors_label")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SME_CATEGORIES.map((c) => {
                const active = prefs.categories.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCategory(c)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {active && <Check className="mr-1 inline h-3 w-3" />}
                    {categoryLabel(c, lang)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("rec_risk_label")}
              </div>
              <div className="flex gap-1.5">
                {RISKS.map((r) => {
                  const active = prefs.riskAppetite.includes(r);
                  return (
                    <button
                      key={r}
                      onClick={() => toggleRisk(r)}
                      className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {t(`risk_${r}`)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("rec_min_roi")}: <span className="text-primary">{prefs.minROI}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={prefs.minROI}
                onChange={(e) => setPrefs((p) => ({ ...p, minROI: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.preferTrending}
              onChange={(e) => setPrefs((p) => ({ ...p, preferTrending: e.target.checked }))}
              className="accent-primary"
            />
            {t("rec_boost")}
          </label>
        </Card>
      )}

      {prefs.categories.length === 0 && !editing && (
        <Card className="flex flex-col items-center gap-2 p-6 text-center">
          <Sparkles className="h-8 w-8 text-primary/40" />
          <p className="text-sm text-muted-foreground">{t("rec_empty")}</p>
          <Button size="sm" onClick={() => setEditing(true)}>
            {t("rec_set")}
          </Button>
        </Card>
      )}

      {prefs.categories.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {prefs.categories.map((c) => (
              <Badge key={c} variant="secondary" className="rounded-full">
                {categoryLabel(c, lang)}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((sme) => (
              <SMECard key={sme.id} sme={sme} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
