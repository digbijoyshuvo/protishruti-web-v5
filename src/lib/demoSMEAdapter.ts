import type { DemoSME } from "./demoSMEs";
import type { ShopProfile } from "./shopProfile";

/** Adapt a DemoSME into the ShopProfile shape so SMEProfileView can render it. */
export function demoSMEToShopProfile(s: DemoSME): ShopProfile {
  return {
    id: s.id,
    owner_id: "demo",
    name: s.name,
    address: s.location,
    category: s.category,
    contact_phone: null,
    contact_email: null,
    trade_license_no: null,
    owner_nid: null,
    business_age_years: null,
    verified: s.featured,
    logo_path: null,
    cover_path: null,
    description: s.description,
    founded_year: null,
    website: null,
    social_links: {},
    funding_goal: s.fundingGoal,
    current_funding: s.currentInvestment,
    roi_expectation: s.roi,
    monthly_revenue: s.monthlyRevenue,
    team_size: s.investorsCount,
    risk_level: s.riskLevel,
    tags: s.tags,
    owner_display_name: s.owner.name,
  };
}

/** Provide direct cover/logo URLs from the demo dataset since they aren't in storage. */
export function demoSMEAssets(s: DemoSME) {
  return { coverUrl: s.image, logoUrl: s.owner.avatar };
}
