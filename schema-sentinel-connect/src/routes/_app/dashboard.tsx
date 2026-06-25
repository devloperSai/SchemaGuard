import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  BellRing,
  ArrowUpRight,
  Plus,
  Clock,
  Radio,
  ShieldCheck,
  GitBranch,
} from "lucide-react";
import {
  AppShell,
  StatusDot,
  MethodBadge,
  SeverityBadge,
  LoadingPanel,
} from "@/components/app/AppShell";
import type { DriftLog, Severity } from "@/lib/mock";
import { TimeAgo } from "@/components/app/TimeAgo";
import { useStore, store } from "@/lib/store";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SchemaGuard" }] }),
  component: DashboardPage,
});

// Polling keeps the feed/counts fresh without a socket connection (which
// would need a real, authenticated user id to scope the room to).
const DRIFT_POLL_MS = 15_000;

function DashboardPage() {
  const initialized = useStore((s) => s.initialized);
  const endpoints = useStore((s) => s.endpoints);
  const driftLogs = useStore((s) => s.driftLogs);

  useEffect(() => {
    const id = setInterval(() => store.loadDriftLogs(), DRIFT_POLL_MS);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const total = endpoints.length;
    const healthy = endpoints.filter((e) => e.status === "healthy").length;
    const drifted = endpoints.filter((e) => e.status === "drifted").length;
    const paused = endpoints.filter((e) => e.status === "paused").length;
    const unack = driftLogs.filter((d) => d.status === "unacknowledged").length;
    return { total, healthy, drifted, paused, unack };
  }, [endpoints, driftLogs]);

  const sla =
    stats.total - stats.paused > 0 ? (stats.healthy / (stats.total - stats.paused)) * 100 : 100;

  const sorted = useMemo(
    () => [...driftLogs].sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt)),
    [driftLogs],
  );
  const feed = sorted.slice(0, 8);
  const recent = sorted.slice(0, 4);

  const sevCounts = driftLogs.reduce<Record<Severity, number>>(
    (acc, d) => ({ ...acc, [d.severity]: (acc[d.severity] ?? 0) + 1 }),
    { low: 0, medium: 0, high: 0, critical: 0 },
  );

  if (!initialized) {
    return (
      <AppShell title="Dashboard" subtitle="Real-time API integrity & schema drift monitoring">
        <LoadingPanel label="Loading dashboard…" />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle="Real-time API integrity & schema drift monitoring"
      actions={
        <>
          <span className="text-mono hidden items-center gap-1.5 rounded-md border border-border/60 bg-surface-2/40 px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground sm:inline-flex">
            <span className="size-1.5 rounded-full bg-brand animate-pulse-soft" /> live
          </span>
          <Link
            to="/endpoints"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-semibold text-background transition-colors hover:bg-white"
          >
            <Plus className="size-3.5" /> Add endpoint
          </Link>
        </>
      }
    >
      {/* ── Hero status bar ─────────────────────────────────────────── */}
      <section className="relative mb-6 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-surface-2/80 via-surface-2/30 to-transparent p-5">
        <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative grid size-12 place-items-center rounded-lg border border-brand/30 bg-brand/10">
              <ShieldCheck className="size-5 text-brand" />
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-brand shadow-[0_0_10px] shadow-brand animate-pulse-soft" />
            </div>
            <div>
              <div className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                System status
              </div>
              <div className="mt-0.5 text-xl font-semibold tracking-tight">
                {stats.total === 0
                  ? "No endpoints yet"
                  : stats.drifted > 0
                    ? "Drift detected"
                    : "All systems nominal"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <HeroMetric label="SLA (current)" value={`${sla.toFixed(2)}%`} />
            <HeroMetric
              label="At risk"
              value={`${stats.drifted}/${stats.total}`}
              warn={stats.drifted > 0}
            />
          </div>
        </div>
      </section>

      {/* ── KPI cards ───────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Total Endpoints"
          value={stats.total}
          hint="across all envs"
        />
        <StatCard
          icon={CheckCircle2}
          label="Healthy"
          value={stats.healthy}
          hint="baseline matched"
          accent="brand"
        />
        <StatCard
          icon={AlertTriangle}
          label="Drifted"
          value={stats.drifted}
          hint="schema mismatch"
          accent="danger"
        />
        <StatCard
          icon={BellRing}
          label="Unacknowledged"
          value={stats.unack}
          hint="needs attention"
          accent="amber"
        />
      </section>

      {/* ── Live feed + severity ─────────────────────────────────────── */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Live drift feed" icon={Radio} hint="polling · 15s" className="lg:col-span-2">
          {feed.length === 0 ? (
            <EmptyRow text="No drift events yet. New events will appear here automatically." />
          ) : (
            <ul className="divide-y divide-border/40">
              {feed.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors animate-fade-in hover:bg-accent/30"
                >
                  <div className="grid size-6 shrink-0 place-items-center rounded border border-danger/20 bg-danger/10 text-danger">
                    <AlertTriangle className="size-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-mono text-[11px] font-medium">{d.endpointName}</span>
                      <SeverityBadge severity={d.severity} />
                    </div>
                    <div className="text-mono mt-0.5 truncate text-[11px] text-muted-foreground">
                      {d.summary}
                    </div>
                  </div>
                  <TimeAgo
                    iso={d.detectedAt}
                    className="text-mono shrink-0 text-[10px] text-muted-foreground/70"
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Drift severity" icon={GitBranch} hint={`${driftLogs.length} total`}>
          {driftLogs.length === 0 ? (
            <EmptyRow text="No drift recorded yet." />
          ) : (
            <div className="flex items-center gap-5 p-5">
              <SeverityDonut counts={sevCounts} />
              <ul className="flex-1 space-y-2 text-xs">
                {(["critical", "high", "medium", "low"] as Severity[]).map((s) => (
                  <li key={s} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${sevDot(s)}`} />
                      <span className="capitalize text-muted-foreground">{s}</span>
                    </span>
                    <span className="text-mono tabular-nums">{sevCounts[s]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </section>

      {/* ── Endpoints + Recent drifts ───────────────────────────────── */}
      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PanelHeader
            title="Monitored endpoints"
            hint={`${endpoints.length} total`}
            action={
              <Link
                to="/endpoints"
                className="text-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                manage →
              </Link>
            }
          />
          {endpoints.length === 0 ? (
            <EmptyPanel text="No endpoints yet. Add your first endpoint to start monitoring." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60 bg-surface-2/40">
              <table className="w-full text-sm">
                <thead className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                    <th className="px-4 py-2.5 text-left font-medium">Endpoint</th>
                    <th className="px-4 py-2.5 text-left font-medium">Method</th>
                    <th className="px-4 py-2.5 text-left font-medium">Drifts</th>
                    <th className="px-4 py-2.5 text-right font-medium">Last check</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoints.map((e) => (
                    <tr
                      key={e.id}
                      className="group border-b border-border/40 last:border-0 transition-colors hover:bg-accent/30"
                    >
                      <td className="px-4 py-3">
                        <StatusDot status={e.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to="/endpoints/$id"
                          params={{ id: e.id }}
                          className="font-medium transition-colors group-hover:text-brand"
                        >
                          {e.name}
                        </Link>
                        <div className="text-mono truncate text-[11px] text-muted-foreground">
                          {e.url}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <MethodBadge method={e.method} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-mono text-xs tabular-nums ${
                            e.driftCount > 0 ? "text-danger" : "text-muted-foreground"
                          }`}
                        >
                          {e.driftCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <TimeAgo
                          iso={e.lastCheckedAt}
                          className="text-mono text-[11px] text-muted-foreground"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <PanelHeader
            title="Recent drift events"
            hint="last 4"
            action={
              <Link
                to="/alerts"
                className="text-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                all →
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyPanel text="No drift events recorded yet." />
          ) : (
            <div className="space-y-2">
              {recent.map((d) => (
                <RecentDriftItem key={d.id} drift={d} />
              ))}
            </div>
          )}
        </div>
      </section>

      <CollectionsSummary />
    </AppShell>
  );
}

function CollectionsSummary() {
  const collections = useStore((s) => s.collections);
  const endpoints = useStore((s) => s.endpoints);
  if (collections.length === 0) return null;

  const counts = collections
    .filter((c) => c.parentId === null)
    .map((c) => {
      const direct = endpoints.filter((e) => e.collectionId === c.id);
      const drifted = direct.filter((e) => e.status === "drifted").length;
      return { c, total: direct.length, drifted };
    });

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Collections</h2>
          <span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {collections.length} groups
          </span>
        </div>
        <Link
          to="/endpoints"
          className="text-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          manage →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(({ c, total, drifted }) => (
          <Link
            key={c.id}
            to="/endpoints"
            className="group rounded-lg border border-border/60 bg-surface-2/40 p-4 transition-colors hover:border-brand/30 hover:bg-surface-2/70"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold tracking-tight">{c.name}</div>
              {drifted > 0 && (
                <span className="text-mono inline-flex h-5 items-center rounded border border-danger/30 bg-danger/10 px-1.5 text-[10px] font-semibold text-danger">
                  {drifted} drift
                </span>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums">{total}</span>
              <span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                endpoints
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────
function HeroMetric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="text-right">
      <div className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 text-lg font-semibold tabular-nums ${warn ? "text-amber-300" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint: string;
  accent?: "brand" | "danger" | "amber";
}) {
  const accentClass = {
    brand: "text-brand bg-brand/10 border-brand/20",
    danger: "text-danger bg-danger/10 border-danger/20",
    amber: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  }[accent ?? "brand"];
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/60 bg-surface-2/40 p-4 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-elevated">
      <div className="flex items-start justify-between">
        <div
          className={`grid size-8 place-items-center rounded-md border ${
            accent ? accentClass : "border-border bg-accent text-muted-foreground"
          }`}
        >
          <Icon className="size-4" />
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
      </div>
      <div className="mt-3">
        <div className="text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
        <div className="text-mono mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground/70">{hint}</div>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  hint,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-border/60 bg-surface-2/40 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon className="size-3.5 text-muted-foreground" />
          <h2 className="text-xs font-semibold tracking-tight">{title}</h2>
        </div>
        {hint && (
          <span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function PanelHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {hint && (
          <span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-4 py-8 text-center text-xs text-muted-foreground">{text}</div>;
}
function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-surface-2/20 px-4 py-10 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}

function RecentDriftItem({ drift }: { drift: DriftLog }) {
  return (
    <Link
      to="/endpoints/$id"
      params={{ id: drift.endpointId }}
      className="group block rounded-lg border border-border/60 bg-surface-2/40 p-3 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-surface-2/70"
    >
      <div className="flex items-center justify-between gap-2">
        <SeverityBadge severity={drift.severity} />
        <span className="text-mono flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="size-3" />
          <TimeAgo iso={drift.detectedAt} />
        </span>
      </div>
      <div className="mt-2 text-xs font-medium transition-colors group-hover:text-brand">
        {drift.endpointName}
      </div>
      <div className="text-mono mt-1 truncate text-[11px] text-muted-foreground">
        {drift.summary}
      </div>
    </Link>
  );
}

function SeverityDonut({ counts }: { counts: Record<Severity, number> }) {
  const order: Severity[] = ["critical", "high", "medium", "low"];
  const colors: Record<Severity, string> = {
    critical: "oklch(0.66 0.22 16)",
    high: "oklch(0.72 0.18 50)",
    medium: "oklch(0.82 0.16 80)",
    low: "oklch(0.55 0.02 285)",
  };
  const total = Math.max(
    order.reduce((s, k) => s + counts[k], 0),
    1,
  );
  const realTotal = order.reduce((s, k) => s + counts[k], 0);
  const r = 36;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative grid size-[120px] place-items-center">
      <svg viewBox="0 0 100 100" className="size-[120px] -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        {order.map((k) => {
          const frac = counts[k] / total;
          const len = frac * c;
          const dash = `${len} ${c - len}`;
          const el = (
            <circle
              key={k}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={colors[k]}
              strokeWidth="10"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-xl font-semibold tabular-nums">{realTotal}</div>
          <div className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            drifts
          </div>
        </div>
      </div>
    </div>
  );
}

function sevDot(s: Severity) {
  return {
    critical: "bg-rose-400",
    high: "bg-orange-400",
    medium: "bg-amber-300",
    low: "bg-muted-foreground/60",
  }[s];
}
