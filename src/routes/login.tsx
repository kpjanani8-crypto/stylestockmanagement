import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck, TrendingUp, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/frontend/ui/button";
import { Input } from "@/frontend/ui/input";
import { Label } from "@/frontend/ui/label";
import logo from "@/frontend/assets/logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Style Stock Manager" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const isValidEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!isValidEmail(normalizedEmail)) {
        toast.error("Please enter a valid email address.");
        return;
      }
      if (mode === "signup") {
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters.");
          return;
        }
        if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
          toast.error("Password must include letters and numbers.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
          setPassword("");
          return;
        }
        toast.success("Welcome aboard!");
        navigate({ to: "/dashboard" });
      } else {
        if (password.length < 1) {
          toast.error("Enter your password.");
          return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) {
          if (/email not confirmed/i.test(error.message)) {
            toast.error("Please confirm your email first. Check your inbox.");
            return;
          }
          if (/invalid login credentials/i.test(error.message)) {
            toast.error("Incorrect email or password.");
            return;
          }
          throw error;
        }
        if (!data.session) {
          toast.info("Please confirm your email before signing in.");
          return;
        }
        toast.success("Signed in.");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      toast.error("Enter your email above first, then tap Forgot.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("If that email exists, a reset link is on its way.");
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
           style={{ background: "linear-gradient(135deg, oklch(0.20 0.03 260) 0%, oklch(0.14 0.02 260) 100%)" }}>
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl gold-gradient" />
        <div className="absolute -bottom-40 -right-32 h-[24rem] w-[24rem] rounded-full opacity-15 blur-3xl gold-gradient" />

        <div className="relative flex items-center gap-3">
          <img src={logo} alt="Style Stock" className="h-10 w-10" />
          <span className="font-display text-lg font-semibold text-white">Style Stock Manager</span>
        </div>

        <div className="relative space-y-8 max-w-md">
          <div>
            <h2 className="font-display text-4xl font-bold leading-tight text-white">
              Run your store with <span className="text-gold-gradient">confidence</span>.
            </h2>
            <p className="mt-4 text-white/70 text-base">
              Track inventory, sales, and profit in one elegant dashboard built for modern retailers.
            </p>
          </div>

          <ul className="space-y-4 text-white/80">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid place-items-center h-8 w-8 rounded-lg bg-white/5 border border-white/10">
                <Package className="h-4 w-4 text-[oklch(0.82_0.16_85)]" />
              </span>
              <span>Smart inventory with low-stock alerts</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid place-items-center h-8 w-8 rounded-lg bg-white/5 border border-white/10">
                <TrendingUp className="h-4 w-4 text-[oklch(0.82_0.16_85)]" />
              </span>
              <span>Live analytics & monthly invoices</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid place-items-center h-8 w-8 rounded-lg bg-white/5 border border-white/10">
                <ShieldCheck className="h-4 w-4 text-[oklch(0.82_0.16_85)]" />
              </span>
              <span>Bank-grade security with Google sign-in</span>
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Style Stock Manager</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8 relative">
        <div className="absolute inset-0 lg:hidden -z-10"
             style={{ background: "linear-gradient(160deg, oklch(0.18 0.02 260) 0%, oklch(0.14 0.02 260) 100%)" }} />
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img src={logo} alt="Style Stock" className="h-9 w-9" />
            <span className="font-display text-base font-semibold">Style Stock Manager</span>
          </div>

          <div className="mb-7">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to manage your store."
                : "Start tracking inventory in seconds."}
            </p>
          </div>

          <Button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            variant="outline"
            className="w-full h-11 bg-card hover:bg-accent border-border font-medium"
          >
            <GoogleIcon className="h-4 w-4 mr-2" />
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11"
                  placeholder="you@shop.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={handleForgot}
                    className="text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={mode === "signup" ? 8 : 1}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground">At least 8 characters, including a letter and a number.</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 gold-gradient text-primary-foreground font-semibold hover:opacity-90 transition shadow-lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to Style Stock?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-foreground hover:text-gold-gradient hover:underline transition"
            >
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>

          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1S8.69 6 12 6c1.88 0 3.14.8 3.86 1.48l2.63-2.54C16.86 3.4 14.66 2.4 12 2.4 6.78 2.4 2.55 6.62 2.55 11.85S6.78 21.3 12 21.3c6.94 0 9.45-4.86 9.45-7.36 0-.5-.05-.88-.12-1.26H12z"/>
      <path fill="#34A853" d="M3.88 7.36l3.2 2.35C7.95 7.85 9.82 6.5 12 6.5c1.62 0 3.08.56 4.23 1.66l3.16-3.08C17.55 3.43 15 2.4 12 2.4 7.7 2.4 4.01 4.88 2.3 8.5l1.58-1.14z" opacity="0"/>
    </svg>
  );
}
