import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { checkEmailExists } from "@/lib/email-check.functions";
import { ArrowLeft, Store, Briefcase, Eye, EyeOff } from "lucide-react";
import logoUrl from "@/assets/protishruti-logo.png";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/app", replace: true });
  }, [authLoading, user, navigate]);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"sme" | "investor">("sme");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleForgotPassword = async () => {
    const normEmail = email.trim().toLowerCase();
    if (!normEmail) {
      toast.error("Please enter your email above first.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(normEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset link sent. Check your email.");
  };

  const checkEmail = useServerFn(checkEmailExists);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normEmail = email.trim().toLowerCase();
      if (mode === "signup") {
        const { exists } = await checkEmail({ data: { email: normEmail } });
        if (exists) {
          toast.error("This email is already registered. Please login instead.");
          setMode("login");
          return;
        }
        try { localStorage.setItem("pending_role", role); } catch {}
        const { data, error } = await supabase.auth.signUp({
          email: normEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          try { localStorage.removeItem("pending_role"); } catch {}
          toast.error("This email is already registered. Please login instead.");
          setMode("login");
          return;
        }
        if (!data.session) {
          toast.success("A confirmation email has been sent. Please verify your email to continue.");
          setMode("login");
          setPassword("");
        } else {
          toast.success(t("saved_ok"));
          navigate({ to: "/app" });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normEmail, password });
        if (error) throw error;
        navigate({ to: "/app" });
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    if (mode === "signup") {
      try { localStorage.setItem("pending_role", role); } catch {}
    } else {
      try { localStorage.removeItem("pending_role"); } catch {}
    }
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message ?? "Google sign-in failed"); setLoading(false); return; }
    if (result.redirected) return;
    navigate({ to: "/app" });
  };

  const tryDemo = async (which: "sme" | "investor") => {
    navigate({ to: which === "sme" ? "/demo/sme" : "/demo/investor" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-[#3D52A0]/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-accent/30 blur-[120px]" />

      {/* Floating header */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="rounded-full border border-border/40 bg-white/80 px-4 backdrop-blur-sm text-muted-foreground hover:bg-accent/40 hover:text-[#3D52A0] transition-all duration-200">
            <ArrowLeft className="h-4 w-4" /> {t("back_to_home")}
          </Button>
        </Link>
        <LangToggle />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="mb-5 flex flex-col items-center">
            <img src={logoUrl} alt="Protishruti Analytics" className="h-24 w-auto object-contain" />
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
              {mode === "login" ? t("welcome_back") : t("create_account_title")}
            </h1>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {mode === "login" ? t("sign_in_workspace") : t("start_digitizing")}
            </p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card py-8 px-4 sm:px-10 shadow-lg">
            {/* Mode switcher */}
            <div className="mb-5 flex gap-1 rounded-xl bg-accent/50 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${mode === "login" ? "bg-white text-[#3D52A0] shadow-sm" : "text-muted-foreground"}`}
              >
                {t("login")}
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${mode === "signup" ? "bg-white text-[#3D52A0] shadow-sm" : "text-muted-foreground"}`}
              >
                {t("signup")}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <>
                  <div>
                    <Label className="text-xs font-medium">{t("full_name")}</Label>
                    <Input
                      className="mt-1 h-11 rounded-xl bg-accent/20 border-border/60"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium">Account type (cannot be changed later)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole("sme")}
                        className={`flex items-center gap-2 rounded-xl border p-3 text-sm transition-all ${role === "sme" ? "border-[#3D52A0] bg-[#3D52A0]/10 text-[#3D52A0]" : "border-border/60 bg-accent/10"}`}
                      >
                        <Store className="h-4 w-4" />
                        <span className="font-medium">{t("i_am_sme")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("investor")}
                        className={`flex items-center gap-2 rounded-xl border p-3 text-sm transition-all ${role === "investor" ? "border-[#3D52A0] bg-[#3D52A0]/10 text-[#3D52A0]" : "border-border/60 bg-accent/10"}`}
                      >
                        <Briefcase className="h-4 w-4" />
                        <span className="font-medium">{t("i_am_investor")}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
              <div>
                <Label className="text-xs font-medium">{t("email")}</Label>
                <Input
                  type="email"
                  className="mt-1 h-11 rounded-xl bg-accent/20 border-border/60"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">{t("password")}</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-medium text-[#3D52A0] hover:underline"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="h-11 rounded-xl bg-accent/20 border-border/60 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="h-11 w-full rounded-xl bg-[#3D52A0] text-white hover:bg-[#3D52A0]/90" disabled={loading}>
                {mode === "login" ? t("login") : t("signup")}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>Or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button type="button" variant="outline" className="h-11 w-full rounded-xl" onClick={handleGoogle} disabled={loading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {t("continue_with_google")}
            </Button>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={() => tryDemo("sme")}
                disabled={loading}
                className="h-10 rounded-xl bg-gradient-to-r from-[#3D52A0] to-[#202D62] text-white hover:opacity-95"
              >
                ✨ SME Demo Mode
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => tryDemo("investor")}
                disabled={loading}
                className="h-10 rounded-xl border-[#3D52A0]/30 text-[#3D52A0]"
              >
                💼 Investor Demo
              </Button>
            </div>

            {mode === "login" && (
              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                Your account type was set at signup and is remembered automatically.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
