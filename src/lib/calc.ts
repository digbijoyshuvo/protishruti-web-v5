// Deterministic business calculations. Never let AI compute these.

export type Txn = {
  txn_date: string;
  total_amount: number;
  type: "sale" | "expense" | "return";
  payment_type: "cash" | "credit" | "baki";
};

export const todayStr = () => new Date().toISOString().slice(0, 10);

export function dayTotals(txns: Txn[], date = todayStr()) {
  const day = txns.filter((t) => t.txn_date === date);
  const sales = day.filter((t) => t.type === "sale").reduce((s, t) => s + Number(t.total_amount), 0);
  const expenses = day.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.total_amount), 0);
  const returns = day.filter((t) => t.type === "return").reduce((s, t) => s + Number(t.total_amount), 0);
  return { sales: sales - returns, expenses, profit: sales - returns - expenses };
}

export function bakiOutstanding(txns: Txn[]) {
  // baki = unpaid sales on credit/baki minus expense-side baki settlements
  const receivable = txns.filter((t) => t.type === "sale" && (t.payment_type === "baki" || t.payment_type === "credit"))
    .reduce((s, t) => s + Number(t.total_amount), 0);
  const settled = txns.filter((t) => t.type === "return" && (t.payment_type === "baki" || t.payment_type === "credit"))
    .reduce((s, t) => s + Number(t.total_amount), 0);
  return Math.max(0, receivable - settled);
}

export function dailySeries(txns: Txn[], days = 30) {
  const map = new Map<string, { sales: number; expenses: number }>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { sales: 0, expenses: 0 });
  }
  for (const t of txns) {
    const e = map.get(t.txn_date);
    if (!e) continue;
    if (t.type === "sale") e.sales += Number(t.total_amount);
    else if (t.type === "return") e.sales -= Number(t.total_amount);
    else if (t.type === "expense") e.expenses += Number(t.total_amount);
  }
  return Array.from(map.entries()).map(([date, v]) => ({ date, net: v.sales - v.expenses, ...v }));
}

// Health score components — configurable weights
export const HEALTH_WEIGHTS = {
  revenue_consistency: 0.30,
  profit_margin: 0.25,
  baki_ratio: 0.20,
  txn_volume: 0.15,
  verification: 0.10,
};

export function healthScore(opts: {
  txns: Txn[];
  verified: boolean;
}) {
  const { txns, verified } = opts;
  const series = dailySeries(txns, 30);
  const sales = series.map((s) => s.sales);
  const avgSales = sales.reduce((a, b) => a + b, 0) / Math.max(1, sales.length);
  const variance = sales.reduce((a, b) => a + (b - avgSales) ** 2, 0) / Math.max(1, sales.length);
  const std = Math.sqrt(variance);
  const cv = avgSales > 0 ? std / avgSales : 1; // lower is better
  const consistency = Math.max(0, Math.min(1, 1 - cv));

  const totalSales = series.reduce((a, b) => a + b.sales, 0);
  const totalExp = series.reduce((a, b) => a + b.expenses, 0);
  const margin = totalSales > 0 ? Math.max(0, (totalSales - totalExp) / totalSales) : 0;

  const baki = bakiOutstanding(txns);
  const bakiRatio = totalSales > 0 ? 1 - Math.min(1, baki / totalSales) : 0.5;

  const volume = Math.min(1, txns.length / 60); // 60+ txns/month = full
  const ver = verified ? 1 : 0.4;

  const components = {
    revenue_consistency: consistency,
    profit_margin: margin,
    baki_ratio: bakiRatio,
    txn_volume: volume,
    verification: ver,
  };
  let raw = 0;
  for (const k of Object.keys(HEALTH_WEIGHTS) as (keyof typeof HEALTH_WEIGHTS)[]) {
    raw += components[k] * HEALTH_WEIGHTS[k];
  }
  return { score: Math.round(raw * 100), components };
}

export function healthTrend(txns: Txn[], verified: boolean, days = 14) {
  const out: { date: string; score: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - i);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const sub = txns.filter((t) => t.txn_date <= cutoffStr);
    out.push({ date: cutoffStr, score: healthScore({ txns: sub, verified }).score });
  }
  return out;
}

export const fmtBDT = (n: number) => "৳ " + Math.round(n).toLocaleString("en-IN");
