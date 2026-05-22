import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/frontend/ui/button";
import { Input } from "@/frontend/ui/input";
import { Label } from "@/frontend/ui/label";
import logo from "@/frontend/assets/logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Style Stock Manager" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Account created! Signing you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/dashboard` });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 relative overflow-hidden"
         style={{ background: "linear-gradient(135deg, oklch(0.18 0.02 260) 0%, oklch(0.22 0.03 260) 50%, oklch(0.16 0.02 260) 100%)" }}>
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-30 blur-3xl gold-gradient" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-20 blur-3xl gold-gradient" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="Style Stock" width={64} height={64} className="h-16 w-16" />
            <h1 className="mt-3 text-2xl font-bold text-gold-gradient">Style Stock Manager</h1>
            <p className="mt-1 text-sm text-white/60">Premium inventory & analytics</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30" placeholder="you@shop.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30" placeholder="••••••••" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full gold-gradient text-primary-foreground font-semibold hover:opacity-90 transition">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === "signin" ? "Sign in" : "Create account")}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/40">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button type="button" onClick={handleGoogle} disabled={loading} variant="outline"
            className="w-full bg-white text-slate-900 hover:bg-white/90 border-white/20">
            <Sparkles className="h-4 w-4 mr-2" /> Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-white/60">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-gold-gradient font-semibold hover:underline">
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
        <p className="text-center mt-4 text-xs text-white/40">
          <Link to="/dashboard">Skip to dashboard →</Link>
        </p>
      </div>
    </div>
  );
}
