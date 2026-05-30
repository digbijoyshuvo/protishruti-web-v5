import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Menu,
  LogOut,
  Globe,
  LayoutDashboard,
  Camera,
  History,
  Bell,
  FileText,
  Users,
  ShieldCheck,
  Settings as SettingsIcon,
  Handshake,
  PencilLine,
  BadgeCheck as IdBadge,
  Store,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useI18n, type Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useShop } from "@/components/ShopGate";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { ReactNode } from "react";
import logoUrl from "@/assets/protishruti-logo.png";

type NavItem = { to: string; labelKey: string; icon: any };
type NavGroup = { labelKey: string; items: NavItem[] };

const smeGroups: NavGroup[] = [
  {
    labelKey: "nav_group_core_ledger",
    items: [
      { to: "/app", labelKey: "dashboard", icon: LayoutDashboard },
      { to: "/app/profile", labelKey: "nav_business_profile", icon: Store },
      { to: "/app/upload", labelKey: "upload_scan", icon: Camera },
      { to: "/app/manual", labelKey: "manual_entry", icon: PencilLine },
      { to: "/app/history", labelKey: "history", icon: History },
    ],
  },
  {
    labelKey: "nav_group_capital_growth",
    items: [
      { to: "/app/find-investor", labelKey: "find_investor", icon: Handshake },
      { to: "/app/identity", labelKey: "nav_identity_verification", icon: IdBadge },
      { to: "/app/verification", labelKey: "verification", icon: ShieldCheck },
    ],
  },
  {
    labelKey: "nav_group_reports_settings",
    items: [
      { to: "/app/documents", labelKey: "documents", icon: FileText },
      { to: "/app/alerts", labelKey: "alerts", icon: Bell },
      { to: "/app/settings", labelKey: "settings", icon: SettingsIcon },
    ],
  },
];

const investorGroups: NavGroup[] = [
  {
    labelKey: "nav_group_investor_portal",
    items: [
      { to: "/app", labelKey: "investor_dashboard", icon: LayoutDashboard },
      { to: "/app/investors", labelKey: "investor_prefs", icon: Users },
    ],
  },
  {
    labelKey: "nav_group_system_config",
    items: [{ to: "/app/settings", labelKey: "settings", icon: SettingsIcon }],
  },
];

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex items-center rounded-full border border-border/60 bg-card p-0.5 text-xs">
      {(["bn", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 rounded-full transition-colors ${
            lang === l ? "bg-[#3D52A0] text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l === "bn" ? "বাংলা" : "EN"}
        </button>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { signOut, roles, user } = useAuth();
  const { verified } = useIdentityVerification();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isInvestor = roles.includes("investor");
  const groups = isInvestor ? investorGroups : smeGroups;
  const flatItems = groups.flatMap((g) => g.items);
  const inlineItems = flatItems.slice(0, 4);

  const displayName =
    (user?.user_metadata as any)?.full_name || user?.email?.split("@")[0] || "Account";
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = isInvestor ? "Investor" : "SME Owner";
  const roleBadge = isInvestor ? "INV" : "SME";

  const isActive = (to: string) => (to === "/app" ? pathname === "/app" : pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-50 h-24 border-b border-border/50 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-border/60 transition-all duration-200 hover:scale-105"
                  aria-label="Menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <DrawerContents
                  groups={groups}
                  isActive={isActive}
                  onNavigate={() => setSidebarOpen(false)}
                  onLogout={async () => {
                    setSidebarOpen(false);
                    await signOut();
                    navigate({ to: "/" });
                  }}
                  displayName={displayName}
                  roleBadge={roleBadge}
                  roleLabel={roleLabel}
                  initial={initial}
                  verified={verified}
                />
              </SheetContent>
            </Sheet>

            <Link to="/app" className="flex items-center transition-transform duration-200 hover:scale-105">
              <img src={logoUrl} alt="Protishruti Analytics" className="h-16 sm:h-24 w-auto object-contain" />
            </Link>

            {/* Desktop inline nav */}
            <nav className="hidden items-center gap-1 border-l border-border/60 pl-3 ml-2 lg:flex">
              {inlineItems.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                      active
                        ? "bg-[#3D52A0]/10 text-[#3D52A0]"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="ml-2 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-accent hover:text-foreground active:scale-95"
                aria-label="Open menu"
              >
                <Menu className="h-3.5 w-3.5" />
                More
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LangToggle />
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#3D52A0] to-[#202D62] text-sm font-bold text-white shadow-sm">
                {initial}
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1 text-xs font-semibold">
                  {displayName}
                  {verified && <VerifiedBadge size="xs" />}
                </div>
                <div className="text-[10px] text-muted-foreground">{roleLabel}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-destructive"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 pb-20 animate-fade-in-up">{children}</main>
    </div>
  );
}

function DrawerContents({
  groups,
  isActive,
  onNavigate,
  onLogout,
  displayName,
  roleBadge,
  roleLabel,
  initial,
  verified,
}: {
  groups: NavGroup[];
  isActive: (to: string) => boolean;
  onNavigate: () => void;
  onLogout: () => void;
  displayName: string;
  roleBadge: string;
  roleLabel: string;
  initial: string;
  verified?: boolean;
}) {
  const { t } = useI18n();
  const { shop } = useShop();

  return (
    <div className="flex h-full flex-col">
      {/* Logo header */}
      <div className="flex items-center justify-center bg-white px-5 py-4 border-b border-border/40">
        <img src={logoUrl} alt="Protishruti Analytics" className="h-32 w-auto object-contain" />
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.labelKey} className="mb-4">
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(g.labelKey)}
            </div>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                      active
                        ? "bg-[#3D52A0]/10 text-[#3D52A0] font-medium"
                        : "text-foreground hover:bg-accent/60"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${active ? "text-[#3D52A0]" : "text-muted-foreground"}`} />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={onLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive transition-all duration-200 hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> {t("logout")}
        </button>

        <div className="my-3 flex items-center justify-between rounded-xl border border-border/60 bg-accent/20 px-3 py-2">
          <span className="flex items-center gap-2 text-xs">
            <Globe className="h-3.5 w-3.5" /> {t("language")}
          </span>
          <LangToggle />
        </div>
      </div>

      {/* Profile footer */}
      <div className="border-t border-border/60 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#3D52A0] to-[#202D62] text-sm font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-[#3D52A0]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#3D52A0]">
                {roleBadge}
              </span>
              <span className="truncate text-xs font-semibold">{displayName}</span>
              {verified && <VerifiedBadge size="xs" />}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {shop?.name ?? roleLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
