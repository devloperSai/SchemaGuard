// Shared frontend types plus a date-formatting util. Auth now lives in
// lib/auth.ts and is backed by the real API — see lib/api.ts's authApi.
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

export function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
