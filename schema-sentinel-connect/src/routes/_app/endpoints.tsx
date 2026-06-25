import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Send, FolderPlus, BookOpen, Zap, FileText } from "lucide-react";
import { AppShell, MethodBadge, StatusDot, LoadingPanel } from "@/components/app/AppShell";
import { EndpointsWorkspace } from "@/components/app/EndpointsWorkspace";
import { RequestTabsBar } from "@/components/app/RequestTabsBar";
import { EndpointBuilder } from "@/components/app/EndpointBuilder";
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

  const createNew = () => {
    store.openNewTab(null);
  };

  return (
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
                Select a request from the sidebar, or start a new one — build, send, and monitor any
                endpoint with full Postman-style tooling.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <ActionCard
                  icon={Zap}
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
  );
}

function ActionCard({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-3 rounded-lg border border-border/60 bg-surface-2/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:bg-surface-2/70"
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-accent text-muted-foreground transition-colors group-hover:border-brand/30 group-hover:bg-brand/10 group-hover:text-brand">
        <Icon className="size-4" />
      </div>
      <div>
        <div className="text-sm font-semibold tracking-tight transition-colors group-hover:text-brand">
          {title}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}
