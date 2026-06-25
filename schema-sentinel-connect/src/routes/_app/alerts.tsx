import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCcw, ExternalLink } from "lucide-react";
import { AppShell, SeverityBadge, LoadingPanel } from "@/components/app/AppShell";
import type { AlertStatus } from "@/lib/mock";
import { TimeAgo } from "@/components/app/TimeAgo";
import { useStore, store } from "@/lib/store";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({ meta: [{ title: "Alerts — SchemaGuard" }] }),
  component: AlertsPage,
});

const TABS: { id: AlertStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unacknowledged", label: "Unacknowledged" },
  { id: "acknowledged", label: "Acknowledged" },
  { id: "resolved", label: "Resolved" },
];

function AlertsPage() {
  const initialized = useStore((s) => s.initialized);
  const logs = useStore((s) => s.driftLogs);
  const [tab, setTab] = useState<AlertStatus | "all">("all");

  useEffect(() => {
    store.loadDriftLogs();
  }, []);

  const filtered = useMemo(
    () => (tab === "all" ? logs : logs.filter((l) => l.status === tab)),
    [tab, logs],
  );
  const counts = useMemo(
    () => ({
      all: logs.length,
      unacknowledged: logs.filter((l) => l.status === "unacknowledged").length,
      acknowledged: logs.filter((l) => l.status === "acknowledged").length,
      resolved: logs.filter((l) => l.status === "resolved").length,
    }),
    [logs],
  );

  if (!initialized) {
    return (
      <AppShell title="Alerts" subtitle="All drift events across every monitored endpoint">
        <LoadingPanel label="Loading alerts…" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Alerts" subtitle="All drift events across every monitored endpoint">
      <div className="mb-4 inline-flex rounded-lg border border-border/60 bg-surface-2/40 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className="text-mono rounded bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-lg border border-border/60 bg-surface-2/40 px-4 py-12 text-center text-sm text-muted-foreground">
            {logs.length === 0 ? "No drift events recorded yet." : "No alerts in this view."}
          </div>
        )}
        {filtered.map((d) => (
          <div
            key={d.id}
            className="group flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-surface-2/40 px-4 py-3 transition-colors hover:border-border hover:bg-surface-2/70"
          >
            <SeverityBadge severity={d.severity} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{d.endpointName}</span>
                <StatusPill status={d.status} />
              </div>
              <div className="text-mono mt-0.5 truncate text-[11px] text-muted-foreground">
                {d.summary}
              </div>
            </div>
            <TimeAgo
              iso={d.detectedAt}
              className="text-mono shrink-0 text-[11px] text-muted-foreground"
            />
            <div className="flex shrink-0 items-center gap-1">
              <Link
                to="/endpoints/$id"
                params={{ id: d.endpointId }}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-surface-2 px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="size-3" /> Details
              </Link>
              <button
                disabled={d.status !== "unacknowledged"}
                onClick={() => store.acknowledgeDriftLog(d.id)}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-surface-2 px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                <Check className="size-3" /> Ack
              </button>
              <button
                disabled={d.status === "resolved"}
                onClick={() => store.resolveDriftLog(d.id)}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-brand/30 bg-brand/10 px-2 text-[11px] font-medium text-brand transition-colors hover:bg-brand/20 disabled:opacity-40"
              >
                <RefreshCcw className="size-3" /> Resolve
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function StatusPill({ status }: { status: AlertStatus }) {
  const cfg = {
    unacknowledged: "text-danger bg-danger/10 border-danger/20",
    acknowledged: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    resolved: "text-brand bg-brand/10 border-brand/20",
  }[status];
  return (
    <span
      className={`text-mono inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-semibold uppercase tracking-wider ${cfg}`}
    >
      {status}
    </span>
  );
}
