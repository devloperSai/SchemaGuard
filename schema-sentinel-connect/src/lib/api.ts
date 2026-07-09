// Thin REST client for the SchemaGuard backend. Auth is mocked client-side
// for now (see lib/mock.ts) and the backend runs with SKIP_AUTH=true, so no
// token needs to be sent yet. Once a real login flow exists, attach
// `Authorization: Bearer <token>` below and nothing else needs to change.
import type { EndpointConfig, Collection, Environment } from "./store";
import type { DriftLog, DiffRow } from "./mock";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message ?? `Request failed: ${res.status}`);
  }
  return json as T;
}

export const endpointsApi = {
  list: () => request<{ endpoints: EndpointConfig[] }>("/endpoints").then((r) => r.endpoints),
  get: (id: string) =>
    request<{ endpoint: EndpointConfig }>(`/endpoints/${id}`).then((r) => r.endpoint),
  upsert: (ep: EndpointConfig) => {
    // isDraft is a client-only flag (unsaved-tab tracking) — never persisted.
    const { isDraft, ...payload } = ep;
    return request<{ endpoint: EndpointConfig }>(`/endpoints/${ep.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }).then((r) => r.endpoint);
  },
  remove: (id: string) => request(`/endpoints/${id}`, { method: "DELETE" }),
  toggle: (id: string) =>
    request<{ endpoint: EndpointConfig }>(`/endpoints/${id}/toggle`, {
      method: "PATCH",
    }).then((r) => r.endpoint),
};

// Backend collections don't carry a UI-only `expanded` flag — store.ts adds it.
export type ApiCollection = Omit<Collection, "expanded">;

export const collectionsApi = {
  list: () => request<{ collections: ApiCollection[] }>("/collections").then((r) => r.collections),
  upsert: (c: Pick<Collection, "id" | "name" | "parentId">) =>
    request<{ collection: ApiCollection }>(`/collections/${c.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: c.name, parentId: c.parentId }),
    }).then((r) => r.collection),
  remove: (id: string) => request(`/collections/${id}`, { method: "DELETE" }),
};

// Environments are now backend-persisted (previously client-only, per the
// old code comment in store.ts) so the poller can resolve {{VAR}} tokens
// server-side against the same data the user configured in the UI.
export const environmentsApi = {
  list: () => request<{ environments: Environment[] }>("/environments").then((r) => r.environments),
  upsert: (e: Pick<Environment, "id" | "name" | "variables">) =>
    request<{ environment: Environment }>(`/environments/${e.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: e.name, variables: e.variables }),
    }).then((r) => r.environment),
  remove: (id: string) => request(`/environments/${id}`, { method: "DELETE" }),
};

export interface ExecuteResult {
  status: number;
  time: number;
  size: string;
  body: string;
  headers: Record<string, string>;
  error?: string;
}

export const proxyApi = {
  execute: (req: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    params?: Record<string, string>;
    body?: unknown;
    timeoutMs?: number;
  }) =>
    request<{ result: ExecuteResult }>("/proxy/execute", {
      method: "POST",
      body: JSON.stringify(req),
    }).then((r) => r.result),
};

// ─── Drift logs ─────────────────────────────────────────────────────────────
// Backend stores addedFields/removedFields/typeChangedFields separately;
// this flattens them into the single `diff` array the UI expects.
function toDriftLog(raw: any): DriftLog {
  const endpointId =
    typeof raw.endpointId === "object" && raw.endpointId !== null
      ? (raw.endpointId.id ?? raw.endpointId._id ?? "")
      : (raw.endpointId ?? "");

  const diff: DiffRow[] = [
    ...(raw.removedFields ?? []).map((f: any) => ({
      changeType: "REMOVED" as const,
      field: f.field,
      baselineType: String(f.baselineType ?? ""),
      liveType: "—",
    })),
    ...(raw.addedFields ?? []).map((f: any) => ({
      changeType: "ADDED" as const,
      field: f.field,
      baselineType: "—",
      liveType: String(f.liveType ?? ""),
    })),
    ...(raw.typeChangedFields ?? []).map((f: any) => ({
      changeType: "TYPE_CHANGED" as const,
      field: f.field,
      baselineType: String(f.baselineType ?? ""),
      liveType: String(f.liveType ?? ""),
    })),
  ];

  return {
    id: raw.id ?? raw._id,
    endpointId,
    endpointName: raw.endpointName ?? "",
    severity: raw.severity,
    detectedAt: raw.detectedAt,
    status: raw.status,
    summary: raw.summary ?? "",
    diff,
  };
}

export const driftApi = {
  list: () => request<{ logs: any[] }>("/drift").then((r) => r.logs.map(toDriftLog)),
  byEndpoint: (endpointId: string) =>
    request<{ logs: any[] }>(`/drift/endpoint/${endpointId}`).then((r) => r.logs.map(toDriftLog)),
  acknowledge: (id: string) =>
    request<{ log: any }>(`/drift/${id}/acknowledge`, { method: "PATCH" }).then((r) =>
      toDriftLog(r.log),
    ),
  resolve: (id: string) =>
    request<{ log: any }>(`/drift/${id}/resolve`, { method: "PATCH" }).then((r) =>
      toDriftLog(r.log),
    ),
};
