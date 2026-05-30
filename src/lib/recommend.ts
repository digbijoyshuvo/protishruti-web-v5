// Weighted scoring used by the "Recommended for you" rail and search ranking.

import type { DemoSME } from "./demoSMEs";
import { fundingProgress } from "./demoSMEs";
import type { InvestorPrefs } from "./investorPrefs";

export type ScoredSME = DemoSME & { score: number; reason: string };

export function recommendSMEs(smes: DemoSME[], prefs: InvestorPrefs): ScoredSME[] {
  const scored = smes.map((s) => {
    const reasons: string[] = [];
    let score = 40;

    if (prefs.categories.includes(s.category)) {
      score += 30;
      reasons.push(`matches your interest in ${s.category}`);
    }
    if (prefs.riskAppetite.includes(s.riskLevel)) {
      score += 10;
    } else {
      score -= 15;
    }
    if (s.roi >= prefs.minROI) {
      score += Math.min(15, Math.round(s.roi - prefs.minROI));
      if (s.roi >= 20) reasons.push(`high ROI of ${s.roi}%`);
    } else {
      score -= 10;
    }
    if (s.featured) {
      score += 6;
      reasons.push("featured opportunity");
    }
    if (prefs.preferTrending && s.trending) {
      score += 8;
      reasons.push("currently trending");
    }
    // Popularity tilt
    score += Math.min(10, s.investorsCount / 8);
    // Almost-funded urgency
    const progress = fundingProgress(s);
    if (progress >= 70 && progress < 100) {
      score += 4;
      reasons.push(`${progress}% funded`);
    }

    return {
      ...s,
      score: Math.max(0, Math.min(100, Math.round(score))),
      reason:
        reasons.length > 0
          ? `Recommended because it ${reasons.slice(0, 2).join(" and ")}.`
          : "Solid pick across your filters.",
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}
