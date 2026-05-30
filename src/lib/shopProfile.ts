import { supabase } from "@/integrations/supabase/client";

export type ShopProfile = {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  category: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  trade_license_no: string | null;
  owner_nid: string | null;
  business_age_years: number | null;
  verified: boolean;
  logo_path: string | null;
  cover_path: string | null;
  description: string | null;
  founded_year: number | null;
  website: string | null;
  social_links: Record<string, string>;
  funding_goal: number | null;
  current_funding: number;
  roi_expectation: number | null;
  monthly_revenue: number | null;
  team_size: number | null;
  risk_level: "low" | "medium" | "high" | null;
  tags: string[];
  owner_display_name: string | null;
};

export const SHOP_ASSETS_BUCKET = "shop-assets";

export function publicAssetUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(SHOP_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=70";

const PROFILE_FIELDS: Array<keyof ShopProfile> = [
  "name",
  "logo_path",
  "cover_path",
  "owner_display_name",
  "category",
  "description",
  "founded_year",
  "address",
  "contact_phone",
  "contact_email",
  "website",
  "funding_goal",
  "roi_expectation",
  "monthly_revenue",
  "team_size",
  "risk_level",
  "tags",
];

export function profileCompletion(p: Partial<ShopProfile> | null): number {
  if (!p) return 0;
  let filled = 0;
  for (const k of PROFILE_FIELDS) {
    const v = (p as any)[k];
    if (Array.isArray(v)) {
      if (v.length > 0) filled++;
    } else if (v !== null && v !== undefined && v !== "") {
      filled++;
    }
  }
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

export function fundingProgressPct(p: Pick<ShopProfile, "funding_goal" | "current_funding"> | null) {
  if (!p || !p.funding_goal || p.funding_goal <= 0) return 0;
  return Math.min(100, Math.round((p.current_funding / p.funding_goal) * 100));
}

export function formatBDT(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "৳—";
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n}`;
}

export async function uploadShopAsset(opts: {
  userId: string;
  shopId: string;
  kind: "logo" | "cover";
  file: File;
}): Promise<string> {
  const ext = opts.file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${opts.userId}/${opts.shopId}/${opts.kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(SHOP_ASSETS_BUCKET)
    .upload(path, opts.file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  return path;
}
