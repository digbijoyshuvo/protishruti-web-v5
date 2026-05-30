// Realistic dummy SME catalog used by the investor dashboard for showcase,
// recommendations and search. Images come from Unsplash (stable hot-link URLs).

export type RiskLevel = "low" | "medium" | "high";

// Aligned with the SME signup categories in src/lib/categories.ts so investor
// filters/recommendations use exactly the same taxonomy SME owners pick from.
import { BUSINESS_CATEGORIES } from "./categories";

export type SMECategory = string;

export const SME_CATEGORIES: SMECategory[] = BUSINESS_CATEGORIES.map((c) => c.value);

export type DemoSME = {
  id: string;
  name: string;
  category: SMECategory;
  description: string;
  location: string;
  fundingGoal: number; // BDT
  currentInvestment: number; // BDT
  roi: number; // percent
  riskLevel: RiskLevel;
  monthlyRevenue: number; // BDT
  image: string;
  owner: { name: string; avatar: string; role: string };
  tags: string[];
  featured: boolean;
  trending?: boolean;
  rating: number; // 0-5
  investorsCount: number;
  createdAt: string; // ISO
};

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;
const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=3D52A0&textColor=ffffff`;

export const DEMO_SMES: DemoSME[] = [
  {
    id: "sme-001",
    name: "Rahim Organic Farms",
    category: "vegetable",
    description:
      "Pesticide-free vegetable cooperative supplying 40+ Dhaka restaurants with daily fresh produce.",
    location: "Savar, Dhaka",
    fundingGoal: 1500000,
    currentInvestment: 1125000,
    roi: 18.5,
    riskLevel: "low",
    monthlyRevenue: 420000,
    image: img("1500382017468-9049fed747ef"),
    owner: { name: "Rahim Uddin", avatar: avatar("Rahim Uddin"), role: "Founder" },
    tags: ["organic", "B2B", "verified", "subscription"],
    featured: true,
    trending: true,
    rating: 4.8,
    investorsCount: 32,
    createdAt: "2025-08-12",
  },
  {
    id: "sme-002",
    name: "Nakshi Threads",
    category: "tailoring",
    description:
      "Handloom kantha apparel brand selling on Shopify, exporting to UK and Canada.",
    location: "Jamalpur",
    fundingGoal: 2200000,
    currentInvestment: 1320000,
    roi: 22.0,
    riskLevel: "medium",
    monthlyRevenue: 680000,
    image: img("1558769132-cb1aea458c5e"),
    owner: { name: "Tahmina Akter", avatar: avatar("Tahmina Akter"), role: "Designer" },
    tags: ["export", "handmade", "DTC"],
    featured: true,
    rating: 4.7,
    investorsCount: 41,
    createdAt: "2025-09-02",
  },
  {
    id: "sme-003",
    name: "Padma Pickles Co.",
    category: "restaurant",
    description:
      "Traditional achar producer with HACCP-certified kitchen, listed on Chaldal and Daraz.",
    location: "Rajshahi",
    fundingGoal: 800000,
    currentInvestment: 720000,
    roi: 16.2,
    riskLevel: "low",
    monthlyRevenue: 310000,
    image: img("1604908176997-125f25cc6f3d"),
    owner: { name: "Salma Begum", avatar: avatar("Salma Begum"), role: "Owner" },
    tags: ["FMCG", "marketplace", "HACCP"],
    featured: false,
    trending: true,
    rating: 4.6,
    investorsCount: 28,
    createdAt: "2025-07-21",
  },
  {
    id: "sme-004",
    name: "ByteBari",
    category: "service",
    description:
      "POS + inventory SaaS for kirana shops, 1,200 paying merchants across 6 cities.",
    location: "Banani, Dhaka",
    fundingGoal: 5000000,
    currentInvestment: 2150000,
    roi: 28.5,
    riskLevel: "high",
    monthlyRevenue: 950000,
    image: img("1551434678-e076c223a692"),
    owner: { name: "Arif Hossain", avatar: avatar("Arif Hossain"), role: "CEO" },
    tags: ["SaaS", "recurring", "scale-up"],
    featured: true,
    trending: true,
    rating: 4.9,
    investorsCount: 67,
    createdAt: "2025-10-15",
  },
  {
    id: "sme-005",
    name: "Tangail Loom House",
    category: "manufacturing",
    description: "Weaver collective of 80 artisans producing premium tant sarees.",
    location: "Tangail",
    fundingGoal: 1200000,
    currentInvestment: 540000,
    roi: 14.0,
    riskLevel: "low",
    monthlyRevenue: 245000,
    image: img("1605518216938-7c31b7b14ad0"),
    owner: { name: "Mohammad Ali", avatar: avatar("Mohammad Ali"), role: "Master Weaver" },
    tags: ["heritage", "cooperative", "export-ready"],
    featured: false,
    rating: 4.5,
    investorsCount: 19,
    createdAt: "2025-06-04",
  },
  {
    id: "sme-006",
    name: "Cox's Seafood Direct",
    category: "restaurant",
    description: "Cold-chain seafood supplier from Cox's Bazar to Dhaka restaurants.",
    location: "Cox's Bazar",
    fundingGoal: 3500000,
    currentInvestment: 2800000,
    roi: 21.5,
    riskLevel: "medium",
    monthlyRevenue: 1250000,
    image: img("1535473895227-bdecb20fb157"),
    owner: { name: "Kamal Hossain", avatar: avatar("Kamal Hossain"), role: "Operations" },
    tags: ["cold-chain", "B2B", "logistics"],
    featured: true,
    trending: true,
    rating: 4.7,
    investorsCount: 52,
    createdAt: "2025-09-18",
  },
  {
    id: "sme-007",
    name: "Sundarban Honey Co.",
    category: "vegetable",
    description: "Mangrove honey producer with GI certification, retailing across South Asia.",
    location: "Khulna",
    fundingGoal: 950000,
    currentInvestment: 380000,
    roi: 17.8,
    riskLevel: "low",
    monthlyRevenue: 195000,
    image: img("1587049352846-4a222e784d38"),
    owner: { name: "Rezaul Karim", avatar: avatar("Rezaul Karim"), role: "Founder" },
    tags: ["GI-certified", "natural", "export"],
    featured: false,
    rating: 4.6,
    investorsCount: 14,
    createdAt: "2025-05-22",
  },
  {
    id: "sme-008",
    name: "Dhaka Streetwear",
    category: "tailoring",
    description: "Gen-Z streetwear label with 80k Instagram followers and pop-up retail.",
    location: "Dhanmondi, Dhaka",
    fundingGoal: 1800000,
    currentInvestment: 1620000,
    roi: 25.0,
    riskLevel: "high",
    monthlyRevenue: 510000,
    image: img("1483985988355-763728e1935b"),
    owner: { name: "Nadia Rahman", avatar: avatar("Nadia Rahman"), role: "Creative Director" },
    tags: ["DTC", "social-commerce", "brand"],
    featured: false,
    trending: true,
    rating: 4.4,
    investorsCount: 38,
    createdAt: "2025-10-30",
  },
  {
    id: "sme-009",
    name: "EcoBrick BD",
    category: "manufacturing",
    description: "Recycled-plastic brick maker for low-cost housing developers.",
    location: "Gazipur",
    fundingGoal: 4200000,
    currentInvestment: 1680000,
    roi: 19.5,
    riskLevel: "medium",
    monthlyRevenue: 780000,
    image: img("1565793298595-6a879b1d9492"),
    owner: { name: "Sajid Khan", avatar: avatar("Sajid Khan"), role: "Co-founder" },
    tags: ["impact", "B2B", "sustainability"],
    featured: true,
    rating: 4.5,
    investorsCount: 24,
    createdAt: "2025-08-29",
  },
  {
    id: "sme-010",
    name: "Lalbagh Spice House",
    category: "kirana",
    description: "Old Dhaka spice retailer with growing e-commerce arm and 3 outlets.",
    location: "Lalbagh, Dhaka",
    fundingGoal: 600000,
    currentInvestment: 510000,
    roi: 15.0,
    riskLevel: "low",
    monthlyRevenue: 280000,
    image: img("1596040033229-a9821ebd058d"),
    owner: { name: "Abdul Mannan", avatar: avatar("Abdul Mannan"), role: "Owner" },
    tags: ["legacy", "omnichannel"],
    featured: false,
    rating: 4.3,
    investorsCount: 17,
    createdAt: "2025-04-11",
  },
  {
    id: "sme-011",
    name: "SkillBari Academy",
    category: "service",
    description: "Vocational training for garment workers, partnered with 12 RMG factories.",
    location: "Mirpur, Dhaka",
    fundingGoal: 2000000,
    currentInvestment: 900000,
    roi: 20.0,
    riskLevel: "medium",
    monthlyRevenue: 540000,
    image: img("1524178232363-1fb2b075b655"),
    owner: { name: "Farzana Hoque", avatar: avatar("Farzana Hoque"), role: "Director" },
    tags: ["edtech", "B2B", "impact"],
    featured: false,
    rating: 4.6,
    investorsCount: 22,
    createdAt: "2025-07-08",
  },
  {
    id: "sme-012",
    name: "JuteCraft Studio",
    category: "manufacturing",
    description: "Designer jute goods exporter, recently featured at Paris Maison&Objet.",
    location: "Faridpur",
    fundingGoal: 1300000,
    currentInvestment: 780000,
    roi: 18.0,
    riskLevel: "medium",
    monthlyRevenue: 360000,
    image: img("1528698827591-e19ccd7bc23d"),
    owner: { name: "Imran Chowdhury", avatar: avatar("Imran Chowdhury"), role: "Founder" },
    tags: ["export", "design", "eco"],
    featured: true,
    rating: 4.7,
    investorsCount: 31,
    createdAt: "2025-09-25",
  },
  {
    id: "sme-013",
    name: "RidePro Logistics",
    category: "service",
    description: "Last-mile delivery network for e-commerce in 4 divisional cities.",
    location: "Chittagong",
    fundingGoal: 3800000,
    currentInvestment: 1900000,
    roi: 23.0,
    riskLevel: "high",
    monthlyRevenue: 1100000,
    image: img("1601758228041-f3b2795255f1"),
    owner: { name: "Tariq Aziz", avatar: avatar("Tariq Aziz"), role: "COO" },
    tags: ["logistics", "scale-up", "tech-enabled"],
    featured: false,
    trending: true,
    rating: 4.5,
    investorsCount: 44,
    createdAt: "2025-10-02",
  },
  {
    id: "sme-014",
    name: "Sylhet Tea Roasters",
    category: "tea_stall",
    description: "Specialty single-origin tea brand sourcing from 6 Sylhet estates.",
    location: "Sylhet",
    fundingGoal: 1100000,
    currentInvestment: 660000,
    roi: 17.0,
    riskLevel: "low",
    monthlyRevenue: 320000,
    image: img("1576092768241-dec231879fc3"),
    owner: { name: "Anika Sultana", avatar: avatar("Anika Sultana"), role: "Founder" },
    tags: ["specialty", "DTC", "premium"],
    featured: false,
    rating: 4.6,
    investorsCount: 26,
    createdAt: "2025-06-19",
  },
  {
    id: "sme-015",
    name: "Bogra Furniture Works",
    category: "manufacturing",
    description: "Solid-wood furniture workshop supplying corporate offices nationwide.",
    location: "Bogra",
    fundingGoal: 2600000,
    currentInvestment: 1040000,
    roi: 16.5,
    riskLevel: "medium",
    monthlyRevenue: 590000,
    image: img("1555041469-a586c61ea9bc"),
    owner: { name: "Habibur Rahman", avatar: avatar("Habibur Rahman"), role: "Owner" },
    tags: ["B2B", "manufacturing"],
    featured: false,
    rating: 4.4,
    investorsCount: 18,
    createdAt: "2025-05-30",
  },
  {
    id: "sme-016",
    name: "Bay of Bengal Salt",
    category: "kirana",
    description: "Premium sea-salt producer with food-grade refinery and HORECA distribution.",
    location: "Chittagong",
    fundingGoal: 1700000,
    currentInvestment: 850000,
    roi: 19.0,
    riskLevel: "medium",
    monthlyRevenue: 470000,
    image: img("1518110925495-b37653b29406"),
    owner: { name: "Mostafa Kamal", avatar: avatar("Mostafa Kamal"), role: "MD" },
    tags: ["HORECA", "FMCG"],
    featured: false,
    rating: 4.5,
    investorsCount: 21,
    createdAt: "2025-08-04",
  },
  {
    id: "sme-017",
    name: "PixelHaat",
    category: "service",
    description: "Mobile-first marketplace for rural artisans, 4,500 active sellers.",
    location: "Uttara, Dhaka",
    fundingGoal: 4500000,
    currentInvestment: 1350000,
    roi: 30.0,
    riskLevel: "high",
    monthlyRevenue: 620000,
    image: img("1556761175-5973dc0f32e7"),
    owner: { name: "Sumaiya Islam", avatar: avatar("Sumaiya Islam"), role: "CEO" },
    tags: ["marketplace", "rural", "high-growth"],
    featured: true,
    trending: true,
    rating: 4.8,
    investorsCount: 58,
    createdAt: "2025-11-01",
  },
  {
    id: "sme-018",
    name: "Mymensingh Dairy Co-op",
    category: "kirana",
    description: "120-farmer dairy cooperative bottling pasteurized milk and ghee.",
    location: "Mymensingh",
    fundingGoal: 1400000,
    currentInvestment: 980000,
    roi: 15.5,
    riskLevel: "low",
    monthlyRevenue: 410000,
    image: img("1550583724-b2692b85b150"),
    owner: { name: "Liton Sarker", avatar: avatar("Liton Sarker"), role: "Chairman" },
    tags: ["cooperative", "FMCG", "rural"],
    featured: false,
    rating: 4.4,
    investorsCount: 23,
    createdAt: "2025-07-14",
  },
];

// --- Derived helpers ---------------------------------------------------------

export const fundingProgress = (s: DemoSME) =>
  Math.min(100, Math.round((s.currentInvestment / s.fundingGoal) * 100));

export const formatBDT = (n: number) => {
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n}`;
};

// Aggregate portfolio metrics for the investor dashboard.
export function portfolioMetrics(smes: DemoSME[]) {
  const totalInvestments = smes.reduce((a, s) => a + s.currentInvestment, 0);
  const totalGoal = smes.reduce((a, s) => a + s.fundingGoal, 0);
  const avgROI = smes.length
    ? smes.reduce((a, s) => a + s.roi, 0) / smes.length
    : 0;
  const active = smes.filter((s) => fundingProgress(s) < 100).length;
  const pending = smes.filter((s) => fundingProgress(s) >= 90 && fundingProgress(s) < 100).length;
  // Synthesised monthly growth: weighted by ROI and progress.
  const growth = smes.length
    ? smes.reduce((a, s) => a + s.roi * (fundingProgress(s) / 100), 0) / smes.length
    : 0;
  return {
    totalInvestments,
    totalGoal,
    avgROI: Math.round(avgROI * 10) / 10,
    active,
    pending,
    monthlyGrowth: Math.round(growth * 10) / 10,
  };
}

// Simple 12-month synthesised growth series used by the area chart.
export function buildGrowthSeries(smes: DemoSME[]) {
  const base = smes.reduce((a, s) => a + s.currentInvestment, 0) / 12;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((m, i) => {
    const factor = 0.55 + i * 0.06 + (i % 3) * 0.02;
    return { month: m, value: Math.round(base * factor) };
  });
}

// Synthetic recent activity feed.
export type ActivityItem = {
  id: string;
  type: "investment" | "milestone" | "request" | "payout";
  sme: string;
  amount?: number;
  message: string;
  time: string;
};

export function buildActivity(smes: DemoSME[]): ActivityItem[] {
  const picks = smes.slice(0, 6);
  const types: ActivityItem["type"][] = ["investment", "payout", "milestone", "request", "investment", "payout"];
  const times = ["2m ago", "27m ago", "1h ago", "3h ago", "Yesterday", "2 days ago"];
  return picks.map((s, i) => ({
    id: `act-${i}`,
    type: types[i],
    sme: s.name,
    amount: types[i] === "milestone" ? undefined : Math.round(s.currentInvestment / (i + 4)),
    message:
      types[i] === "investment"
        ? `New investment received`
        : types[i] === "payout"
          ? `Monthly payout disbursed`
          : types[i] === "milestone"
            ? `Reached ${fundingProgress(s)}% of funding goal`
            : `New introduction request`,
    time: times[i],
  }));
}
