import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Plus, X, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore, store } from "@/lib/store";
import { METHOD_COLOR } from "@/components/app/AppShell";

/**
 * Postman-style request tab strip. Lives at the top of the endpoints workspace,
 * above the breadcrumb/URL bar. Each tab represents an open request (saved or draft).
 */
export function RequestTabsBar() {
  const tabs = useStore((s) => s.openTabs);
  const activeTabId = useStore((s) => s.activeTabId);
  const endpoints = useStore((s) => s.endpoints);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (st) => st.location.pathname });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [menuOpen]);

  /** Activate a tab. EndpointsLanding renders the EndpointBuilder inline for
   *  whichever endpoint is active, so no route change is needed here. */
  const go = (tabId: string) => {
    store.setActiveTab(tabId);
  };

  const close = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    store.closeTab(tabId);
  };

  const createNew = () => {
    store.openNewTab(null);
  };

  // If the last tab is closed while sitting on an old-style edit route, go back to the list.
  useEffect(() => {
    const onEditRoute = pathname.startsWith("/endpoints/") && pathname.endsWith("/edit");
    if (!activeTabId && onEditRoute) navigate({ to: "/endpoints" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, pathname]);

  if (tabs.length === 0) {
    return (
      <div className="flex h-9 shrink-0 items-center border-b border-border/60 bg-surface-2/30 px-2">
        <button
          onClick={createNew}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-3.5" /> New request
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-9 shrink-0 items-stretch border-b border-border/60 bg-surface-2/30">
      <div className="flex flex-1 items-stretch overflow-x-auto">
        {tabs.map((t) => {
          const ep = endpoints.find((e) => e.id === t.id);
          const active = t.id === activeTabId;
          const methodColor = ep
            ? (METHOD_COLOR[ep.method] ?? "text-muted-foreground")
            : "text-muted-foreground";
          return (
            <div
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => go(t.id)}
              className={`group relative flex min-w-[120px] max-w-[200px] shrink-0 cursor-pointer items-center gap-2 border-r border-border/40 px-3 text-xs transition-colors ${
                active
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              }`}
            >
              <span
                className={`text-mono shrink-0 text-[10px] font-bold tracking-wider ${methodColor}`}
              >
                {ep?.method ?? "GET"}
              </span>
              <span className="min-w-0 flex-1 truncate">{ep?.name || "Untitled request"}</span>
              <button
                onClick={(e) => close(e, t.id)}
                aria-label="Close tab"
                className="grid size-4 shrink-0 place-items-center rounded text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:!bg-accent hover:!text-foreground"
              >
                {t.dirty ? (
                  <span className="size-1.5 rounded-full bg-brand group-hover:hidden" />
                ) : null}
                <X className={`size-3 ${t.dirty ? "hidden group-hover:block" : ""}`} />
              </button>
              {active && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" />}
            </div>
          );
        })}
        <button
          onClick={createNew}
          aria-label="New request"
          title="New request"
          className="grid w-9 shrink-0 place-items-center text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {/* Overflow / all-tabs menu */}
      <div ref={menuRef} className="relative shrink-0 border-l border-border/40">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="All tabs"
          title="All tabs"
          className="grid h-full w-9 place-items-center text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
        >
          <ChevronDown className="size-3.5" />
        </button>
        {menuOpen && (
          <div className="animate-fade-in absolute right-0 top-9 z-50 w-64 overflow-hidden rounded-md border border-border bg-popover shadow-elevated">
            <div className="text-mono flex items-center justify-between border-b border-border/60 px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              Open tabs · {tabs.length}
              <button
                onClick={() => {
                  store.closeAllTabs();
                  setMenuOpen(false);
                  navigate({ to: "/endpoints" });
                }}
                className="text-[10px] normal-case text-muted-foreground hover:text-danger"
              >
                Close all
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {tabs.map((t) => {
                const ep = endpoints.find((e) => e.id === t.id);
                const methodColor = ep
                  ? (METHOD_COLOR[ep.method] ?? "text-muted-foreground")
                  : "text-muted-foreground";
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      go(t.id);
                      setMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-accent ${
                      t.id === activeTabId ? "bg-accent/60" : ""
                    }`}
                  >
                    <span
                      className={`text-mono w-14 shrink-0 text-[10px] font-bold tracking-wider ${methodColor}`}
                    >
                      {ep?.method ?? "GET"}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {ep?.name || "Untitled request"}
                    </span>
                    {t.dirty && <span className="size-1.5 shrink-0 rounded-full bg-brand" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
