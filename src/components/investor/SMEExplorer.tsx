import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  SME_CATEGORIES,
  type DemoSME,
  type SMECategory,
  type RiskLevel,
  fundingProgress,
} from "@/lib/demoSMEs";
import { SMECard, SMECardSkeleton } from "./SMECard";
import { useI18n } from "@/lib/i18n";
import { categoryLabel } from "@/lib/categories";

type SortKey = "trending" | "most_funded" | "newest" | "highest_roi";

const SORT_KEYS: SortKey[] = ["trending", "most_funded", "newest", "highest_roi"];
const SORT_T: Record<SortKey, string> = {
  trending: "sort_trending",
  most_funded: "sort_most_funded",
  newest: "sort_newest",
  highest_roi: "sort_highest_roi",
};

const RISKS: RiskLevel[] = ["low", "medium", "high"];

type Props = {
  smes: DemoSME[];
  loading?: boolean;
};

export function SMEExplorer({ smes, loading }: Props) {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<SortKey>("trending");
  const [cats, setCats] = useState<SMECategory[]>([]);
  const [risks, setRisks] = useState<RiskLevel[]>([]);
  const [minROI, setMinROI] = useState(0);
  const [fundingMax, setFundingMax] = useState<number | "">("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 120);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    let list = smes.filter((s) => {
      if (cats.length && !cats.includes(s.category)) return false;
      if (risks.length && !risks.includes(s.riskLevel)) return false;
      if (s.roi < minROI) return false;
      if (fundingMax !== "" && s.fundingGoal > Number(fundingMax)) return false;
      if (debounced) {
        const haystack =
          `${s.name} ${s.category} ${s.location} ${s.description} ${s.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(debounced)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "most_funded":
          return fundingProgress(b) - fundingProgress(a);
        case "newest":
          return b.createdAt.localeCompare(a.createdAt);
        case "highest_roi":
          return b.roi - a.roi;
        case "trending":
        default:
          return (Number(b.trending) - Number(a.trending)) || b.investorsCount - a.investorsCount;
      }
    });
    return list;
  }, [smes, cats, risks, minROI, fundingMax, debounced, sort]);

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const clearAll = () => {
    setCats([]);
    setRisks([]);
    setMinROI(0);
    setFundingMax("");
    setQuery("");
  };

  const activeFilterCount =
    cats.length + risks.length + (minROI > 0 ? 1 : 0) + (fundingMax !== "" ? 1 : 0);

  return (
    <div className="space-y-4">
      <Card className="space-y-3 border-border/60 bg-white/60 p-4 shadow-card backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder={t("ex_search_ph")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                aria-label={t("ex_clear_search")}
                onClick={() => setQuery("")}
                className="absolute right-2 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {SORT_KEYS.map((s) => (
                <option key={s} value={s}>
                  {t("sort_label")}: {t(SORT_T[s])}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-md"
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="mr-1 h-4 w-4" />
              {t("filters")}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="animate-fade-in-up space-y-3 border-t border-border/60 pt-3">
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("ex_category")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SME_CATEGORIES.map((c) => {
                  const active = cats.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => setCats(toggle(cats, c))}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {categoryLabel(c, lang)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("ex_risk")}
                </div>
                <div className="flex gap-1.5">
                  {RISKS.map((r) => {
                    const active = risks.includes(r);
                    return (
                      <button
                        key={r}
                        onClick={() => setRisks(toggle(risks, r))}
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
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("ex_min_roi")}: <span className="text-primary">{minROI}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={minROI}
                  onChange={(e) => setMinROI(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("ex_max_funding")}
                </div>
                <Input
                  type="number"
                  placeholder={t("ex_max_funding_ph")}
                  value={fundingMax}
                  onChange={(e) =>
                    setFundingMax(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <Button size="sm" variant="ghost" onClick={clearAll} className="text-xs">
                <X className="mr-1 h-3 w-3" /> {t("clear_all")}
              </Button>
            )}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          {filtered.length === 1 ? t("opportunity_found") : t("opportunities_found")}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SMECardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <Search className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="font-display text-lg font-semibold">{t("no_match_title")}</h3>
          <p className="max-w-md text-sm text-muted-foreground">{t("no_match_sub")}</p>
          <Button variant="outline" size="sm" onClick={clearAll} className="mt-2">
            {t("reset_filters")}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sme) => (
            <SMECard key={sme.id} sme={sme} highlight={debounced} />
          ))}
        </div>
      )}
    </div>
  );
}
