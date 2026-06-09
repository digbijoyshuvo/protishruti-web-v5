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
  // Allow storing direct image URLs (e.g. seeded demo shops) in cover_path/logo_path.
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = supabase.storage.from(SHOP_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=70";

const DEFAULT_COVERS_BY_CATEGORY: Record<string, string> = {
  kirana:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=70",
  vegetable:
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1600&q=70",
  restaurant:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=70",
  tailoring:
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1600&q=70",
  electronics:
    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1600&q=70",
  pharmacy:
    "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=1600&q=70",
  hardware:
    "https://images.unsplash.com/photo-1581141849291-1125c5f90218?auto=format&fit=crop&w=1600&q=70",
  cosmetics:
    "https://images.unsplash.com/photo-1522335789203-1a8dc95a08f1?auto=format&fit=crop&w=1600&q=70",
  mobile:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=70",
  stationery:
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1600&q=70",
  tea_stall:
    "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1600&q=70",
  manufacturing:
    "https://images.unsplash.com/photo-1565043589221-238a5f6fe8fe?auto=format&fit=crop&w=1600&q=70",
  service:
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=70",
  other:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=70",
};

export function defaultCoverForCategory(category: string | null | undefined): string {
  if (!category) return DEFAULT_COVER;
  return DEFAULT_COVERS_BY_CATEGORY[category] ?? DEFAULT_COVER;
}

/** Returns a stable tailwind gradient class for the given category (for logo fallback backgrounds). */
export function categoryLogoGradient(category: string | null | undefined): string {
  const map: Record<string, string> = {
    kirana: "from-emerald-400/30 to-emerald-600/10",
    vegetable: "from-green-400/30 to-green-600/10",
    restaurant: "from-orange-400/30 to-orange-600/10",
    tailoring: "from-pink-400/30 to-pink-600/10",
    electronics: "from-blue-400/30 to-blue-600/10",
    pharmacy: "from-teal-400/30 to-teal-600/10",
    hardware: "from-slate-400/30 to-slate-600/10",
    cosmetics: "from-rose-400/30 to-rose-600/10",
    mobile: "from-indigo-400/30 to-indigo-600/10",
    stationery: "from-amber-400/30 to-amber-600/10",
    tea_stall: "from-yellow-400/30 to-yellow-600/10",
    manufacturing: "from-stone-400/30 to-stone-600/10",
    service: "from-cyan-400/30 to-cyan-600/10",
    other: "from-primary/20 to-primary/5",
  };
  return map[category ?? ""] ?? "from-primary/20 to-primary/5";
}

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
