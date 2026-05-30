import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logoUrl from "@/assets/protishruti-logo.png";
import { InvestorDashboard } from "@/components/InvestorDashboard";

export const Route = createFileRoute("/demo/investor")({ component: DemoInvestor });

export default function DemoInvestor() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Protishruti Analytics" className="h-10 w-auto object-contain" />
            <Badge variant="outline" className="border-[#3D52A0]/40 text-[#3D52A0]">💼 Investor Demo</Badge>
          </div>
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="h-4 w-4" /> Exit demo
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <Card className="flex items-center justify-between border-accent bg-accent/30 p-3">
          <span className="text-xs text-accent-foreground">
            This is a sample investor dashboard with mock SMEs, recommendations, and search. Sign up to see real, verified opportunities.
          </span>
          <Badge variant="secondary">DEMO</Badge>
        </Card>

        <InvestorDashboard />

        <div className="flex justify-center pt-2">
          <Link to="/auth">
            <Button size="lg" className="rounded-full bg-[#3D52A0] hover:bg-[#3D52A0]/90">
              Create your investor account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
