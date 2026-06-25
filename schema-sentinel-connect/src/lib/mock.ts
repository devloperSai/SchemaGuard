// Shared frontend types, plus the (still-mocked, localStorage-based) auth
// helpers and a date-formatting util. This file no longer contains any
// seed/sample data — all endpoint, collection, and drift data now comes
// from the live API (see lib/api.ts + lib/store.ts).
export type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
export type EndpointStatus = "healthy" | "drifted" | "paused";
export type Severity = "low" | "medium" | "high" | "critical";
export type AlertStatus = "unacknowledged" | "acknowledged" | "resolved";
export type ChangeType = "REMOVED" | "ADDED" | "TYPE_CHANGED";

export interface Endpoint {
  id: string;
  name: string;
  url: string;
  method: Method;
  intervalMin: number;
  status: EndpointStatus;
  lastCheckedAt: string;
  driftCount: number;
}

export interface DiffRow {
  changeType: ChangeType;
  field: string;
  baselineType: string;
  liveType: string;
}

export interface DriftLog {
  id: string;
  endpointId: string;
  endpointName: string;
  severity: Severity;
  detectedAt: string;
  status: AlertStatus;
  summary: string;
  diff: DiffRow[];
}

// --- Auth (mock, localStorage) — deferred until real auth is wired ---
const TOKEN_KEY = "sg_token";
const USER_KEY = "sg_user";

export interface AuthUser {
  email: string;
  name: string;
}

export const auth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  login(email: string, name = email.split("@")[0]) {
    const token = "mock." + btoa(email + ":" + Date.now());
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ email, name }));
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
