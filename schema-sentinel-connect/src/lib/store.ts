// Lightweight reactive store (useSyncExternalStore) for collections, endpoints,
// environments, and drift logs. Everything starts empty and is loaded from the
// real API in `init()` — there is no local seed/demo fallback anymore. If the
// API is unreachable, `state.error` is set so the UI can surface it.
import { useSyncExternalStore } from "react";
import type { Endpoint, Method, DriftLog } from "./mock";
import { endpointsApi, collectionsApi, driftApi, environmentsApi } from "./api";

export type AuthKind = "none" | "bearer" | "apiKey" | "basic" | "inherit";
export type BodyKind =
  | "none"
  | "json"
  | "form-data"
  | "x-www-form-urlencoded"
  | "raw"
  | "binary"
  | "graphql";
export type KV = { id: string; key: string; value: string; enabled: boolean; description?: string };

export type CheckType = "schema_drift" | "uptime" | "response_time" | "content_match";
export type AlertOn = "first_failure" | "consecutive_2" | "consecutive_3" | "consecutive_5";

export interface EndpointConfig extends Endpoint {
  collectionId: string | null;
  timeoutMs: number;
  followRedirects: boolean;
  sslVerify: boolean;
  tags: string[];
  environmentId: string | null;
  params: KV[];
  headersKv: KV[];
  auth: {
    kind: AuthKind;
    bearer?: string;
    apiKey?: { key: string; value: string; in: "header" | "query" };
    basic?: { user: string; pass: string };
  };
  body: {
    kind: BodyKind;
    json?: string;
    raw?: string;
    rawLang?: string;
    form?: KV[];
    urlencoded?: KV[];
  };
  preScript: string;
  postScript?: string;
  /** Which of the Monitoring Wizard's check types this endpoint enforces. */
  checkTypes: CheckType[];
  /** Required for the "uptime" check; null = "any 2xx". */
  expectedStatus: number | null;
  /** Required for the "response_time" check, in ms. */
  responseTimeThresholdMs: number | null;
  /** Required for the "content_match" check. */
  contentMatch: { field: string; value: string };
  /** How many consecutive failures before an alert actually fires. */
  alertOn: AlertOn;
  /** Client-only: true for a tab that hasn't been saved yet. Never persisted. */
  isDraft?: boolean;
}

export interface Collection {
  id: string;
  parentId: string | null;
  name: string;
  expanded: boolean;
}

export interface EnvVar {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  secret: boolean;
}
export interface Environment {
  id: string;
  name: string;
  variables: EnvVar[];
}

export interface OpenTab {
  id: string;
  dirty: boolean;
}

const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

interface State {
  collections: Collection[];
  endpoints: EndpointConfig[];
  environments: Environment[];
  activeEnvId: string;
  openTabs: OpenTab[];
  activeTabId: string | null;
  driftLogs: DriftLog[];
  initialized: boolean;
  error: string | null;
}

let state: State = {
  collections: [],
  endpoints: [],
  environments: [],
  activeEnvId: "",
  openTabs: [],
  activeTabId: null,
  driftLogs: [],
  initialized: false,
  error: null,
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const emit = () => listeners.forEach((l) => l());
const setState = (patch: Partial<State> | ((s: State) => Partial<State>)) => {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  emit();
};

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => sel(state),
    () => sel(state),
  );
}

// Persists a single environment's current in-memory state to the API. Called
// after any environment/env-var mutation below (setState is synchronous, so
// `state` already reflects the change by the time this reads it).
function persistEnvironment(envId: string) {
  const env = state.environments.find((e) => e.id === envId);
  if (env)
    environmentsApi.upsert(env).catch((err) => console.error("Failed to save environment:", err));
}

let initPromise: Promise<void> | null = null;

// ─── Actions ────────────────────────────────────────────────────────────────
export const store = {
  /** Loads collections, endpoints, environments, and drift logs from the API.
   *  Idempotent — safe to call from multiple mounted components (e.g. React
   *  strict mode). */
  async init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      try {
        const [collections, endpoints, driftLogs, environments] = await Promise.all([
          collectionsApi.list(),
          endpointsApi.list(),
          driftApi.list(),
          environmentsApi.list(),
        ]);
        setState({
          collections: collections.map((c) => ({ ...c, expanded: true })),
          endpoints,
          driftLogs,
          environments,
          activeEnvId: environments[0]?.id ?? "",
          initialized: true,
          error: null,
        });
      } catch (err) {
        console.error("Failed to load data from the SchemaGuard API:", err);
        setState({
          initialized: true,
          error: err instanceof Error ? err.message : "Could not reach the API",
        });
      }
    })();
    return initPromise;
  },

  // ── Drift logs ──────────────────────────────────────────────────────────
  async loadDriftLogs() {
    try {
      const driftLogs = await driftApi.list();
      setState({ driftLogs, error: null });
    } catch (err) {
      console.error("Failed to load drift logs:", err);
    }
  },
  acknowledgeDriftLog(id: string) {
    setState((s) => ({
      driftLogs: s.driftLogs.map((d) => (d.id === id ? { ...d, status: "acknowledged" } : d)),
    }));
    driftApi.acknowledge(id).catch((err) => console.error("Failed to acknowledge drift:", err));
  },
  resolveDriftLog(id: string) {
    setState((s) => ({
      driftLogs: s.driftLogs.map((d) => (d.id === id ? { ...d, status: "resolved" } : d)),
    }));
    driftApi.resolve(id).catch((err) => console.error("Failed to resolve drift:", err));
  },

  // ── Collections ──────────────────────────────────────────────────────────
  addCollection(parentId: string | null, name = "New collection") {
    const c: Collection = { id: uid("col"), parentId, name, expanded: true };
    setState((s) => ({ collections: [...s.collections, c] }));
    collectionsApi.upsert(c).catch((err) => console.error("Failed to create collection:", err));
    return c.id;
  },
  renameCollection(id: string, name: string) {
    setState((s) => ({
      collections: s.collections.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
    const col = state.collections.find((c) => c.id === id);
    if (col) collectionsApi.upsert({ ...col, name }).catch((err) => console.error(err));
  },
  toggleCollection(id: string) {
    // UI-only (expand/collapse), not persisted.
    setState((s) => ({
      collections: s.collections.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c)),
    }));
  },
  deleteCollection(id: string) {
    const all = state.collections;
    const ids = new Set<string>([id]);
    let added = true;
    while (added) {
      added = false;
      for (const c of all)
        if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
          ids.add(c.id);
          added = true;
        }
    }
    setState((s) => ({
      collections: s.collections.filter((c) => !ids.has(c.id)),
      endpoints: s.endpoints.map((e) =>
        ids.has(e.collectionId ?? "") ? { ...e, collectionId: null } : e,
      ),
    }));
    collectionsApi.remove(id).catch((err) => console.error("Failed to delete collection:", err));
  },
  moveCollection(id: string, parentId: string | null) {
    if (id === parentId) return;
    setState((s) => ({
      collections: s.collections.map((c) => (c.id === id ? { ...c, parentId } : c)),
    }));
    const col = state.collections.find((c) => c.id === id);
    if (col) collectionsApi.upsert({ ...col, parentId }).catch((err) => console.error(err));
  },

  // ── Endpoints ────────────────────────────────────────────────────────────
  moveEndpoint(id: string, collectionId: string | null) {
    setState((s) => ({
      endpoints: s.endpoints.map((e) => (e.id === id ? { ...e, collectionId } : e)),
    }));
    const ep = state.endpoints.find((e) => e.id === id);
    if (ep) endpointsApi.upsert({ ...ep, collectionId }).catch((err) => console.error(err));
  },
  deleteEndpoint(id: string) {
    setState((s) => ({
      endpoints: s.endpoints.filter((e) => e.id !== id),
      openTabs: s.openTabs.filter((t) => t.id !== id),
      activeTabId:
        s.activeTabId === id ? (s.openTabs.find((t) => t.id !== id)?.id ?? null) : s.activeTabId,
    }));
    endpointsApi.remove(id).catch((err) => console.error("Failed to delete endpoint:", err));
  },
  toggleEndpointStatus(id: string) {
    setState((s) => ({
      endpoints: s.endpoints.map((e) =>
        e.id === id ? { ...e, status: e.status === "paused" ? "healthy" : "paused" } : e,
      ),
    }));
    endpointsApi.toggle(id).catch((err) => console.error("Failed to toggle endpoint:", err));
  },
  upsertEndpoint(ep: EndpointConfig) {
    const saved: EndpointConfig = { ...ep, isDraft: false };
    setState((s) => {
      const exists = s.endpoints.some((x) => x.id === saved.id);
      return {
        endpoints: exists
          ? s.endpoints.map((x) => (x.id === saved.id ? saved : x))
          : [saved, ...s.endpoints],
      };
    });
    endpointsApi.upsert(saved).catch((err) => console.error("Failed to save endpoint:", err));
  },
  newEndpointTemplate(collectionId: string | null = null): EndpointConfig {
    return {
      id: uid("ep"),
      name: "Untitled request",
      url: "https://",
      method: "GET" as Method,
      intervalMin: 5,
      status: "healthy",
      lastCheckedAt: new Date().toISOString(),
      driftCount: 0,
      collectionId,
      timeoutMs: 8000,
      followRedirects: true,
      sslVerify: true,
      tags: [],
      environmentId: state.activeEnvId || null,
      params: [{ id: uid("kv"), key: "", value: "", enabled: true }],
      headersKv: [{ id: uid("kv"), key: "Accept", value: "application/json", enabled: true }],
      auth: { kind: "none" },
      body: { kind: "none", json: "{\n  \n}", raw: "", rawLang: "JSON" },
      preScript: "// Runs before each poll. Available: req, env, console\n",
      postScript: "// Runs after every poll. Available: res, schema, pm\n",
      checkTypes: ["schema_drift", "uptime"],
      expectedStatus: null,
      responseTimeThresholdMs: null,
      contentMatch: { field: "", value: "" },
      alertOn: "first_failure",
      isDraft: true,
    };
  },

  // ── Open tabs (Postman-style request tabs) ─────────────────────────────
  openTab(id: string) {
    setState((s) => {
      if (s.openTabs.some((t) => t.id === id)) {
        return s.activeTabId === id ? {} : { activeTabId: id };
      }
      return { openTabs: [...s.openTabs, { id, dirty: false }], activeTabId: id };
    });
  },
  openNewTab(collectionId: string | null = null): string {
    const ep = store.newEndpointTemplate(collectionId);
    setState((s) => ({
      endpoints: [ep, ...s.endpoints],
      openTabs: [...s.openTabs, { id: ep.id, dirty: false }],
      activeTabId: ep.id,
    }));
    return ep.id;
  },
  closeTab(id: string) {
    setState((s) => {
      const idx = s.openTabs.findIndex((t) => t.id === id);
      if (idx === -1) return {};
      const nextTabs = s.openTabs.filter((t) => t.id !== id);
      let nextActive = s.activeTabId;
      if (s.activeTabId === id) {
        const fallback = nextTabs[idx] ?? nextTabs[idx - 1] ?? nextTabs[nextTabs.length - 1];
        nextActive = fallback ? fallback.id : null;
      }
      // Drop never-saved drafts entirely so they don't linger in the list.
      const ep = s.endpoints.find((e) => e.id === id);
      const wasUnsaved = !!ep && ep.isDraft === true;
      return {
        openTabs: nextTabs,
        activeTabId: nextActive,
        ...(wasUnsaved ? { endpoints: s.endpoints.filter((e) => e.id !== id) } : {}),
      };
    });
  },
  closeAllTabs() {
    setState((s) => {
      const unsavedIds = new Set(
        s.openTabs
          .map((t) => t.id)
          .filter((id) => s.endpoints.find((e) => e.id === id)?.isDraft === true),
      );
      return {
        openTabs: [],
        activeTabId: null,
        endpoints: s.endpoints.filter((e) => !unsavedIds.has(e.id)),
      };
    });
  },
  setActiveTab(id: string) {
    setState((s) => (s.activeTabId === id ? {} : { activeTabId: id }));
  },
  setTabDirty(id: string, dirty: boolean) {
    setState((s) => {
      const tab = s.openTabs.find((t) => t.id === id);
      if (!tab || tab.dirty === dirty) return {};
      return { openTabs: s.openTabs.map((t) => (t.id === id ? { ...t, dirty } : t)) };
    });
  },
  bindTab(oldId: string, newId: string) {
    setState((s) => {
      if (oldId === newId) {
        return { openTabs: s.openTabs.map((t) => (t.id === newId ? { ...t, dirty: false } : t)) };
      }
      return {
        openTabs: s.openTabs.map((t) => (t.id === oldId ? { id: newId, dirty: false } : t)),
        activeTabId: s.activeTabId === oldId ? newId : s.activeTabId,
      };
    });
  },

  // ── Environments (now API-backed — was local-only, see api.ts) ─────────
  activateEnv(id: string) {
    setState({ activeEnvId: id });
  },
  addEnvironment(name: string) {
    const e: Environment = { id: uid("env"), name, variables: [] };
    setState((s) => ({
      environments: [...s.environments, e],
      activeEnvId: s.activeEnvId || e.id,
    }));
    environmentsApi.upsert(e).catch((err) => console.error("Failed to create environment:", err));
    return e.id;
  },
  deleteEnvironment(id: string) {
    setState((s) => ({
      environments: s.environments.filter((e) => e.id !== id),
      activeEnvId:
        s.activeEnvId === id ? (s.environments.find((e) => e.id !== id)?.id ?? "") : s.activeEnvId,
    }));
    environmentsApi.remove(id).catch((err) => console.error("Failed to delete environment:", err));
  },
  updateEnvironment(id: string, patch: Partial<Environment>) {
    setState((s) => ({
      environments: s.environments.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
    persistEnvironment(id);
  },
  addEnvVar(envId: string) {
    const v: EnvVar = { id: uid("v"), key: "", value: "", enabled: true, secret: false };
    setState((s) => ({
      environments: s.environments.map((e) =>
        e.id === envId ? { ...e, variables: [...e.variables, v] } : e,
      ),
    }));
    persistEnvironment(envId);
  },
  updateEnvVar(envId: string, varId: string, patch: Partial<EnvVar>) {
    setState((s) => ({
      environments: s.environments.map((e) =>
        e.id === envId
          ? { ...e, variables: e.variables.map((v) => (v.id === varId ? { ...v, ...patch } : v)) }
          : e,
      ),
    }));
    persistEnvironment(envId);
  },
  deleteEnvVar(envId: string, varId: string) {
    setState((s) => ({
      environments: s.environments.map((e) =>
        e.id === envId ? { ...e, variables: e.variables.filter((v) => v.id !== varId) } : e,
      ),
    }));
    persistEnvironment(envId);
  },
};

export const utils = {
  newKV: (): KV => ({ id: uid("kv"), key: "", value: "", enabled: true, description: "" }),
  paramsToUrl(url: string, params: KV[]): string {
    const [base] = url.split("?");
    const qs = params
      .filter((p) => p.enabled && p.key)
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join("&");
    return qs ? `${base}?${qs}` : base;
  },
  urlToParams(url: string): KV[] {
    const q = url.split("?")[1];
    if (!q) return [];
    return q
      .split("&")
      .filter(Boolean)
      .map((seg) => {
        const [k, v = ""] = seg.split("=");
        return {
          id: uid("kv"),
          key: decodeURIComponent(k),
          value: decodeURIComponent(v),
          enabled: true,
          description: "",
        };
      });
  },
  resolve(input: string, env: Environment | undefined): string {
    if (!env) return input;
    return input.replace(/\{\{(\w+)\}\}/g, (_, k) => {
      const v = env.variables.find((x) => x.enabled && x.key === k);
      return v ? v.value : `{{${k}}}`;
    });
  },
};
