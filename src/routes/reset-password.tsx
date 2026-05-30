import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import logoUrl from "@/assets/protishruti-logo.png";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase recovery links create a session via the onAuthStateChange "PASSWORD_RECOVERY" event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also check existing session in case the event already fired.
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated. You're signed in.");
    navigate({ to: "/app", replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans">
      <div className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-[#3D52A0]/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-accent/30 blur-[120px]" />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/auth">
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-[#3D52A0]">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Button>
        </Link>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="mb-5 flex flex-col items-center">
            <img src={logoUrl} alt="Protishruti Analytics" className="h-24 w-auto object-contain" />
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose a strong password you haven't used before.</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            {!ready ? (
              <p className="text-center text-sm text-muted-foreground">
                Waiting for recovery link… If you didn't open this page from the reset email, please request a new link.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">New password</Label>
                  <div className="relative mt-1">
                    <Input
                      type={show ? "text" : "password"}
                      className="h-11 rounded-xl bg-accent/20 border-border/60 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={show ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium">Confirm new password</Label>
                  <Input
                    type={show ? "text" : "password"}
                    className="mt-1 h-11 rounded-xl bg-accent/20 border-border/60"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="h-11 w-full rounded-xl bg-[#3D52A0] text-white hover:bg-[#3D52A0]/90" disabled={loading}>
                  Update password
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
