import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Send, FolderPlus, BookOpen, FileText, Shield, Bell } from "lucide-react";
import { AppShell, MethodBadge, StatusDot, LoadingPanel } from "@/components/app/AppShell";
import { EndpointsWorkspace } from "@/components/app/EndpointsWorkspace";
import { RequestTabsBar } from "@/components/app/RequestTabsBar";
import { EndpointBuilder } from "@/components/app/EndpointBuilder";
import { MonitoringWizard } from "@/components/app/MonitoringWizard";
import { useStore, store } from "@/lib/store";
import { TimeAgo } from "@/components/app/TimeAgo";

export const Route = createFileRoute("/_app/endpoints")({
  head: () => ({ meta: [{ title: "Endpoints — SchemaGuard" }] }),
  component: EndpointsLanding,
});

function EndpointsLanding() {
  const initialized = useStore((s) => s.initialized);
  const endpoints = useStore((s) => s.endpoints);
  const tabs = useStore((s) => s.openTabs);
  const activeTabId = useStore((s) => s.activeTabId);
  const driftLogs = useStore((s) => s.driftLogs);
  const [monitoringOpen, setMonitoringOpen] = useState(false);
  const navigate = useNavigate();

  if (!initialized) {
    return (
      <AppShell title="Endpoints" subtitle="Postman-style API workspace">
        <LoadingPanel label="Loading endpoints…" />
      </AppShell>
    );
  }

  const recent = [...endpoints]
    .sort((a, b) => +new Date(b.lastCheckedAt) - +new Date(a.lastCheckedAt))
    .slice(0, 6);

  const activeEndpoint = activeTabId ? endpoints.find((e) => e.id === activeTabId) : undefined;
  const unack = driftLogs.filter((d) => d.status === "unacknowledged").length;

  const createNew = () => {
    store.openNewTab(null);
  };

  return (
    <>
      <AppShell
        title="Endpoints"
        subtitle="Postman-style API workspace"
        actions={
          <button
            onClick={createNew}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-semibold text-background transition-colors hover:bg-white"
          >
            <Plus className="size-3.5" /> New request
          </button>
        }
      >
        <EndpointsWorkspace tabsBar={<RequestTabsBar />}>
          {tabs.length === 0 ? (
            <div className="grid min-h-[60vh] place-items-center">
              <div className="w-full max-w-2xl text-center">
                <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl border border-brand/30 bg-brand/10">
                  <Send className="size-6 text-brand" strokeWidth={2} />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">No request open</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Select a request from the sidebar, or start a new one — build, send, and monitor
                  any endpoint with full Postman-style tooling.
                </p>

                <div className="mt-8 space-y-4">
                  {/* Primary feature — full-width hero row, sits above the grid */}
                  <ActionCard
                    icon={Shield}
                    title="Add monitoring"
                    desc="Watch an API for schema drift, downtime, or slow responses"
                    onClick={() => setMonitoringOpen(true)}
                    primary
                  />

                  {/* Secondary actions — clean 2x2 matrix */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ActionCard
                      icon={Send}
                      title="New request"
                      desc="Build a request from scratch"
                      onClick={createNew}
                    />
                    <ActionCard
                      icon={FolderPlus}
                      title="New collection"
                      desc="Group related requests together"
                      onClick={() => store.addCollection(null)}
                    />
                    <ActionCard
                      icon={BookOpen}
                      title="View documentation"
                      desc="Per-endpoint docs & schema notes"
                      onClick={createNew}
                    />
                    <ActionCard
                      icon={Bell}
                      title="View alerts"
                      desc={
                        unack > 0
                          ? `${unack} unacknowledged drift event${unack === 1 ? "" : "s"}`
                          : "Review past drift detections"
                      }
                      onClick={() => navigate({ to: "/alerts" })}
                      badge={unack > 0 ? unack : undefined}
                    />
                  </div>
                </div>

                {recent.length > 0 && (
                  <div className="mt-10 text-left">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Recent
                      </h3>
                      <span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                        {endpoints.length} total
                      </span>
                    </div>
                    <div className="divide-y divide-border/40 overflow-hidden rounded-lg border border-border/60 bg-surface-2/40">
                      {recent.map((e) => (
                        <Link
                          key={e.id}
                          to="/endpoints/$id"
                          params={{ id: e.id }}
                          className="group flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/30"
                        >
                          <StatusDot status={e.status} />
                          <MethodBadge method={e.method} />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium transition-colors group-hover:text-brand">
                            {e.name}
                          </span>
                          <span className="text-mono shrink-0 truncate text-[11px] text-muted-foreground max-w-[40%]">
                            {e.url}
                          </span>
                          <TimeAgo
                            iso={e.lastCheckedAt}
                            className="text-mono hidden shrink-0 text-[10px] text-muted-foreground/70 sm:inline"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeEndpoint ? (
            <EndpointBuilder key={activeEndpoint.id} initial={activeEndpoint} bare />
          ) : (
            <div className="grid min-h-[60vh] place-items-center">
              <div className="text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-3 size-6 text-muted-foreground/60" />
                Select a tab above, or pick a request from the sidebar.
              </div>
            </div>
          )}
        </EndpointsWorkspace>
      </AppShell>

      {monitoringOpen && (
        <MonitoringWizard onClose={() => setMonitoringOpen(false)} initialCollectionId={null} />
      )}
    </>
  );
}

function ActionCard({
  icon: Icon,
  title,
  desc,
  onClick,
  primary,
  badge,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onClick: () => void;
  primary?: boolean;
  badge?: number;
  className?: string;
}) {
  if (primary) {
    return (
      <button
        onClick={onClick}
        className={`group relative overflow-hidden flex w-full items-center gap-4 rounded-xl border border-brand/30 bg-brand/8 px-5 py-4 text-left transition-all hover:border-brand/50 hover:bg-brand/12 hover:-translate-y-0.5 ${className ?? ""}`}
      >
        {/* subtle glow line at top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
        <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-brand/30 bg-brand/15 text-brand transition-colors group-hover:bg-brand/20">
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-brand">{title}</span>
            <span className="text-mono rounded bg-brand/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-widest text-brand">
              Core
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{desc}</div>
        </div>
        <div className="shrink-0 text-brand/40 group-hover:text-brand transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`group relative flex items-start gap-3 rounded-lg border border-border/60 bg-surface-2/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:bg-surface-2/70 ${className ?? ""}`}
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-accent text-muted-foreground transition-colors group-hover:border-brand/30 group-hover:bg-brand/10 group-hover:text-brand">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight transition-colors group-hover:text-brand">
          {title}
          {badge !== undefined && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {badge}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}
