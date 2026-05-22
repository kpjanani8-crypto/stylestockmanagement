import { createFileRoute, Outlet, redirect, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, BarChart3, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/frontend/hooks/use-auth";
import { Button } from "@/frontend/ui/button";
import { cn } from "@/frontend/lib/utils";
import logo from "@/frontend/assets/logo.png";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

function AuthLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <img src={logo} alt="" width={36} height={36} className="h-9 w-9" />
        <div>
          <div className="font-display font-bold text-sidebar-foreground text-sm">Style Stock</div>
          <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">Manager</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.to;
          return (
            <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                active
                  ? "bg-sidebar-accent text-sidebar-primary shadow-[inset_3px_0_0_var(--sidebar-primary)]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}>
              <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", active && "text-sidebar-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-sidebar-border pt-4">
        <div className="px-3 py-2 mb-2">
          <div className="text-xs text-sidebar-foreground/50">Signed in as</div>
          <div className="text-sm text-sidebar-foreground truncate">{user?.email}</div>
        </div>
        <Button onClick={logout} variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-sidebar text-sidebar-foreground border-r border-sidebar-border fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 glass-sidebar text-sidebar-foreground">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b border-border bg-card/80 backdrop-blur">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2"><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="" width={24} height={24} className="h-6 w-6" />
            <span className="font-display font-semibold text-sm">Style Stock</span>
          </div>
          <div className="w-9" />
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
