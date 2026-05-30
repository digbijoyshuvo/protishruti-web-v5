import type { Txn } from "@/lib/calc";

// Generates 30 days of plausible demo transactions for a shop, used only when
// the SME has no real transactions yet so charts and AI summaries can render.
export function generateMockTxns(seed = 1): Txn[] {
  const rand = mulberry32(seed * 1000);
  const out: Txn[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    // 3-7 sales/day
    const sales = 3 + Math.floor(rand() * 5);
    for (let s = 0; s < sales; s++) {
      const amount = 200 + Math.floor(rand() * 1800);
      const pt = rand() < 0.65 ? "cash" : rand() < 0.8 ? "credit" : "baki";
      out.push({ txn_date: dStr, total_amount: amount, type: "sale", payment_type: pt as any });
    }
    // 1-3 expenses/day
    const exps = 1 + Math.floor(rand() * 3);
    for (let e = 0; e < exps; e++) {
      out.push({ txn_date: dStr, total_amount: 150 + Math.floor(rand() * 900), type: "expense", payment_type: "cash" });
    }
  }
  return out;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
