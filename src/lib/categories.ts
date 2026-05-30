export const BUSINESS_CATEGORIES: { value: string; en: string; bn: string }[] = [
  { value: "kirana", en: "Kirana / Grocery", bn: "মুদি / কিরানা" },
  { value: "vegetable", en: "Vegetable / Fruit Wholesale", bn: "সবজি / ফল পাইকারি" },
  { value: "restaurant", en: "Restaurant / Food", bn: "রেস্টুরেন্ট / খাবার" },
  { value: "tailoring", en: "Tailoring / Garments", bn: "দর্জি / পোশাক" },
  { value: "electronics", en: "Electronics", bn: "ইলেকট্রনিক্স" },
  { value: "pharmacy", en: "Pharmacy", bn: "ঔষধের দোকান" },
  { value: "hardware", en: "Hardware", bn: "হার্ডওয়্যার" },
  { value: "cosmetics", en: "Cosmetics / Salon", bn: "কসমেটিকস / সেলুন" },
  { value: "mobile", en: "Mobile / Recharge", bn: "মোবাইল / রিচার্জ" },
  { value: "stationery", en: "Stationery / Books", bn: "স্টেশনারি / বই" },
  { value: "tea_stall", en: "Tea Stall", bn: "চায়ের দোকান" },
  { value: "manufacturing", en: "Micro-manufacturing", bn: "ক্ষুদ্র উৎপাদন" },
  { value: "service", en: "Service Business", bn: "সেবামূলক ব্যবসা" },
  { value: "other", en: "Other", bn: "অন্যান্য" },
];

export function categoryLabel(value: string | null | undefined, lang: "en" | "bn") {
  if (!value) return "—";
  const m = BUSINESS_CATEGORIES.find((c) => c.value === value);
  if (m) return lang === "bn" ? m.bn : m.en;
  return value;
}
