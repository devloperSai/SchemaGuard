import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Shield, LayoutDashboard, Network, Bell, LogOut, Activity, Menu, X } from "lucide-react";
import { auth, type AuthUser } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useEffect, useState, type ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/endpoints", label: "Endpoints", icon: Network },
  { to: "/alerts", label: "Alerts", icon: Bell },
] as const;

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 p-3">
      {nav.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <span
              className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand transition-all duration-200 ${
                active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
              }`}
            />
            <Icon
              className={`size-4 transition-transform duration-200 group-hover:scale-110 ${
                active ? "text-brand" : ""
              }`}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard({ user, onLogout }: { user: AuthUser | null; onLogout: () => void }) {
  return (
    <div className="border-t border-border/60 p-3">
      <div className="mb-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground">
        <Activity className="size-3.5 text-brand" />
        <span className="text-mono">proxy.live</span>
        <span className="ml-auto size-1.5 rounded-full bg-brand animate-pulse-soft" />
      </div>
      <div className="flex items-center gap-2 rounded-md bg-surface-2 px-2 py-2">
        <div className="grid size-7 place-items-center rounded-full bg-brand/20 text-xs font-semibold text-brand">
          {(user?.name?.[0] ?? "U").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium">{user?.name ?? "User"}</div>
          <div className="truncate text-[10px] text-muted-foreground">{user?.email}</div>
        </div>
        <button
          onClick={onLogout}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Sign out"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const apiError = useStore((s) => s.error);

  // auth.getUser() reads from localStorage, which is unavailable during SSR.
  // Defer it to an effect so SSR and the initial client render agree.
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    setUser(auth.getUser());
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    auth.logout();
    navigate({ to: "/login" });
  };

  const Brand = (
    <Link to="/dashboard" className="flex h-14 items-center gap-2 border-b border-border/60 px-5">
      <div className="grid size-6 place-items-center rounded-sm bg-brand">
        <Shield className="size-3.5 text-brand-foreground" strokeWidth={2.5} />
      </div>
      <span className="font-semibold tracking-tight">SchemaGuard</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border/60 bg-surface-2/40 backdrop-blur md:flex">
        {Brand}
        <NavLinks pathname={pathname} />
        <UserCard user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border/60 bg-surface-2 shadow-elevated transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {Brand}
          <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <UserCard user={user} onLogout={handleLogout} />
        </aside>
      </div>

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="grid size-9 shrink-0 place-items-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>
        </header>
        <main
          key={pathname}
          className="mx-auto max-w-7xl px-4 py-6 animate-fade-up sm:px-6 sm:py-8"
        >
          {apiError && (
            <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Couldn't reach the SchemaGuard API ({apiError}). Showing whatever's loaded — try
              refreshing once the server is back up.
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatusDot({ status }: { status: "healthy" | "drifted" | "paused" }) {
  const cfg = {
    healthy: "bg-brand shadow-[0_0_8px] shadow-brand/60",
    drifted: "bg-danger shadow-[0_0_8px] shadow-danger/60 animate-pulse-soft",
    paused: "bg-muted-foreground/60",
  }[status];
  return <span className={`inline-block size-2 rounded-full ${cfg}`} />;
}

/** Postman-style method colors. */
export const METHOD_COLOR: Record<string, string> = {
  GET: "text-teal-300",
  POST: "text-amber-300",
  PUT: "text-sky-300",
  PATCH: "text-violet-300",
  DELETE: "text-rose-300",
  HEAD: "text-cyan-300",
  OPTIONS: "text-pink-300",
};
export function MethodBadge({ method }: { method: string }) {
  const cls = METHOD_COLOR[method] ?? "text-muted-foreground";
  return (
    <span
      className={`text-mono inline-flex h-5 items-center text-[10px] font-bold tracking-wider ${cls}`}
    >
      {method}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" | "critical" }) {
  const cfg = {
    low: "text-muted-foreground bg-muted border-border",
    medium: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    high: "text-orange-300 bg-orange-500/10 border-orange-500/20",
    critical: "text-rose-300 bg-rose-500/10 border-rose-500/20",
  }[severity];
  return (
    <span
      className={`inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-semibold uppercase tracking-wider ${cfg}`}
    >
      {severity}
    </span>
  );
}

export function LoadingPanel({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        {label}
      </div>
    </div>
  );
}
