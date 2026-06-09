import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  UserCircle2,
  TrendingUp,
  ShieldAlert,
  Building2,
  MapPin,
  Wallet,
  Mail,
} from "lucide-react";

export const Route = createFileRoute("/app/investor-profile/$name")({
  component: InvestorProfilePage,
});

type InvestorPayload = {
  investor_name: string;
  match_percentage: number;
  risk_level?: string;
  explanation: string[];
  sme_context?: {
    name?: string;
    category?: string;
    region?: string;
    monthly_revenue?: number;
    current_funding?: number;
    roi_expectation?: number;
    predicted_risk?: string;
  };
};

const fmtUSD = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

const riskTone = (r?: string) => {
  const v = (r || "").toLowerCase();
  if (v.includes("low")) return "bg-success/15 text-success border-success/30";
  if (v.includes("high"))
    return "bg-destructive/15 text-destructive border-destructive/30";
  return "bg-warning/15 text-warning border-warning/40";
};

// Extract a simple field summary out of the model's explanation lines.
function parseFromExplanation(lines: string[]) {
  const joined = lines.join(" ");
  const sectors = joined.match(/target sectors \(([^)]+)\)/i)?.[1];
  const ticket = joined.match(/ticket range \(\$([\d,]+)\s*-\s*\$([\d,]+)\)/i);
  const region = joined.match(/preferred region \(([^)]+)\)/i)?.[1];
  const minRev = joined.match(/investor threshold \(\$([\d,]+)\)/i)?.[1];
  const maxRev = joined.match(/below limit \(\$([\d,]+)\)/i)?.[1];
  const riskTol = joined.match(/risk tolerance \(([^)]+)\)/i)?.[1];
  return { sectors, ticket, region, minRev, maxRev, riskTol };
}

function InvestorProfilePage() {
  const { name } = Route.useParams();
  const [data, setData] = useState<InvestorPayload | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`investor:${name}`);
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, [name]);

  if (!data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="p-6 text-sm text-muted-foreground">
          Investor profile not available. Please reopen it from the AI matches list.
        </Card>
      </div>
    );
  }

  const parsed = parseFromExplanation(data.explanation);
  const initials = data.investor_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-4">
      <BackLink />

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-md">
              {initials || <UserCircle2 className="h-8 w-8" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold tracking-tight">
                  {data.investor_name}
                </h2>
                <Badge className="rounded-full bg-primary text-primary-foreground">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {Math.round(data.match_percentage)}% match
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                AI-suggested investor based on your SME profile.
              </p>
              {data.risk_level && (
                <Badge
                  variant="outline"
                  className={`mt-2 border ${riskTone(data.risk_level)}`}
                >
                  <ShieldAlert className="mr-1 h-3 w-3" />
                  {data.risk_level} risk tolerance
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <Field
            icon={<Building2 className="h-4 w-4" />}
            label="Target sectors"
            value={parsed.sectors || "—"}
          />
          <Field
            icon={<MapPin className="h-4 w-4" />}
            label="Preferred region"
            value={parsed.region || "—"}
          />
          <Field
            icon={<Wallet className="h-4 w-4" />}
            label="Ticket size range"
            value={
              parsed.ticket
                ? `$${parsed.ticket[1]} – $${parsed.ticket[2]}`
                : "—"
            }
          />
          <Field
            icon={<TrendingUp className="h-4 w-4" />}
            label="Revenue range"
            value={
              parsed.minRev || parsed.maxRev
                ? `$${parsed.minRev ?? "?"} – $${parsed.maxRev ?? "?"}`
                : "—"
            }
          />
        </div>
      </Card>

      <Card className="p-5 space-y-2">
        <h3 className="font-display text-base font-bold">Why this match</h3>
        <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
          {data.explanation.map((ex, i) => (
            <li key={i}>{ex}</li>
          ))}
        </ul>
      </Card>

      {data.sme_context && (
        <Card className="p-5 space-y-2">
          <h3 className="font-display text-base font-bold">Your SME context</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="SME" value={data.sme_context.name || "—"} />
            <Field label="Category" value={data.sme_context.category || "—"} />
            <Field label="Region" value={data.sme_context.region || "—"} />
            <Field
              label="Predicted risk"
              value={data.sme_context.predicted_risk || "—"}
            />
            <Field
              label="Monthly revenue"
              value={fmtUSD(data.sme_context.monthly_revenue)}
            />
            <Field
              label="Current funding"
              value={fmtUSD(data.sme_context.current_funding)}
            />
            <Field
              label="ROI expectation"
              value={
                data.sme_context.roi_expectation
                  ? `${data.sme_context.roi_expectation}%`
                  : "—"
              }
            />
          </div>
        </Card>
      )}

      <Button className="w-full" size="lg">
        <Mail className="mr-2 h-4 w-4" /> Request introduction
      </Button>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/app/match-investors"
      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
    >
      <ArrowLeft className="h-4 w-4" /> Back to matches
    </Link>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}