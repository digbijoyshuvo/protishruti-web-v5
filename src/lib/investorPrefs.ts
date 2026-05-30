// Local persistence for investor recommendation preferences. Kept in
// localStorage to avoid a DB migration; structure is API-ready so it can be
// swapped for a server table later without touching consumers.

import type { RiskLevel, SMECategory } from "./demoSMEs";

const KEY = "protishruti.investor.prefs.v1";

export type InvestorPrefs = {
  categories: SMECategory[];
  riskAppetite: RiskLevel[];
  minROI: number;
  preferTrending: boolean;
};

export const DEFAULT_PREFS: InvestorPrefs = {
  categories: [],
  riskAppetite: ["low", "medium", "high"],
  minROI: 0,
  preferTrending: true,
};

export function loadPrefs(): InvestorPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: InvestorPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
