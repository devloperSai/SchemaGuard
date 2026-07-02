import { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Shield,
  Clock,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Zap,
  Globe,
  FileJson,
  Timer,
  Mail,
  Lock,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { store, utils, type EndpointConfig, type AuthKind } from "@/lib/store";
import type { Method } from "@/lib/mock";

// ─── Types ───────────────────────────────────────────────────────────────────

type CheckType = "schema_drift" | "uptime" | "response_time" | "content_match";
type AlertOn = "first_failure" | "consecutive_2" | "consecutive_3" | "consecutive_5";

interface MonitoringFormState {
  // Step 1 — Target
  name: string;
  url: string;
  method: Method;
  authKind: AuthKind;
  bearerToken: string;
  apiKeyName: string;
  apiKeyValue: string;
  apiKeyIn: "header" | "query";
  // Step 2 — Check config
  checkTypes: CheckType[];
  intervalMin: number;
  timeoutMs: number;
  expectedStatus: string;
  contentMatchField: string;
  contentMatchValue: string;
  responseTimeThresholdMs: number;
  alertOn: AlertOn;
  // Step 3 — Notifications
  emailAlerts: boolean;
  collectionId: string | null;
}

const DEFAULT_STATE: MonitoringFormState = {
  name: "",
  url: "",
  method: "GET",
  authKind: "none",
  bearerToken: "",
  apiKeyName: "",
  apiKeyValue: "",
  apiKeyIn: "header",
  checkTypes: ["schema_drift", "uptime"],
  intervalMin: 5,
  timeoutMs: 8000,
  expectedStatus: "200",
  contentMatchField: "",
  contentMatchValue: "",
  responseTimeThresholdMs: 2000,
  alertOn: "first_failure",
  emailAlerts: true,
  collectionId: null,
};

const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const METHOD_COLOR: Record<string, string> = {
  GET: "text-teal-300",
  POST: "text-amber-300",
  PUT: "text-sky-300",
  PATCH: "text-violet-300",
  DELETE: "text-rose-300",
  HEAD: "text-cyan-300",
  OPTIONS: "text-pink-300",
};

const INTERVAL_PRESETS = [
  { label: "30s", value: 0.5 },
  { label: "1m", value: 1 },
  { label: "5m", value: 5 },
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "1h", value: 60 },
];

const CHECK_TYPE_CONFIG: Record<
  CheckType,
  { icon: React.ComponentType<{ className?: string }>; label: string; desc: string; color: string }
> = {
  schema_drift: {
    icon: FileJson,
    label: "Schema drift",
    desc: "Alert when response fields are renamed, removed, or change type",
    color: "brand",
  },
  uptime: {
    icon: Activity,
    label: "Uptime",
    desc: "Alert when the endpoint returns a non-2xx status or is unreachable",
    color: "emerald",
  },
  response_time: {
    icon: Timer,
    label: "Response time",
    desc: "Alert when latency exceeds your defined threshold",
    color: "amber",
  },
  content_match: {
    icon: Zap,
    label: "Content match",
    desc: "Alert when a specific field in the response changes value",
    color: "violet",
  },
};

const ALERT_ON_OPTIONS: { value: AlertOn; label: string }[] = [
  { value: "first_failure", label: "First failure" },
  { value: "consecutive_2", label: "2 consecutive failures" },
  { value: "consecutive_3", label: "3 consecutive failures" },
  { value: "consecutive_5", label: "5 consecutive failures" },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export function MonitoringWizard({
  onClose,
  initialCollectionId = null,
}: {
  onClose: () => void;
  initialCollectionId?: string | null;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<MonitoringFormState>({
    ...DEFAULT_STATE,
    collectionId: initialCollectionId,
  });
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);

  const upd = (patch: Partial<MonitoringFormState>) => setForm((f) => ({ ...f, ...patch }));

  const toggleCheckType = (ct: CheckType) => {
    setForm((f) => ({
      ...f,
      checkTypes: f.checkTypes.includes(ct)
        ? f.checkTypes.filter((x) => x !== ct)
        : [...f.checkTypes, ct],
    }));
  };

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0 && form.url.trim().length > 0;
    if (step === 1) return form.checkTypes.length > 0;
    return true;
  };

  const handleSave = () => {
    setSaving(true);
    // Build tags that encode the monitoring config as metadata so the existing
    // poller + schema extractor can act on it without any backend changes.
    const tags: string[] = [
      "monitored",
      ...form.checkTypes.map((ct) => `check:${ct}`),
      `alert:${form.alertOn}`,
    ];

    const ep: EndpointConfig = {
      id: `ep_${Math.random().toString(36).slice(2, 9)}`,
      name: form.name,
      url: form.url,
      method: form.method,
      intervalMin: form.intervalMin,
      status: "healthy",
      lastCheckedAt: new Date().toISOString(),
      driftCount: 0,
      collectionId: form.collectionId,
      timeoutMs: form.timeoutMs,
      followRedirects: true,
      sslVerify: true,
      tags,
      environmentId: null,
      params: [utils.newKV()],
      headersKv: [
        { id: utils.newKV().id, key: "Accept", value: "application/json", enabled: true },
      ],
      auth: buildAuth(form),
      body: { kind: "none", json: "", raw: "", rawLang: "JSON" },
      preScript: "// Auto-generated by SchemaGuard Monitor\n",
      postScript: buildPostScript(form),
      isDraft: false,
    };

    store.upsertEndpoint(ep);
    store.openTab(ep.id);
    setSaving(false);
    onClose();
  };

  const steps = ["Target", "Checks", "Alerts"];

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border/60 bg-[oklch(0.16_0.005_285)] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-lg bg-brand/15 border border-brand/25">
              <Shield className="size-4 text-brand" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Add monitoring</h2>
              <p className="text-[11px] text-muted-foreground">
                Step {step + 1} of {steps.length} — {steps[step]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-5 pt-4 pb-0 shrink-0">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                  i === step
                    ? "text-brand"
                    : i < step
                      ? "text-muted-foreground hover:text-foreground cursor-pointer"
                      : "text-muted-foreground/40 cursor-default"
                }`}
              >
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${
                    i === step
                      ? "border-brand/60 bg-brand/15 text-brand"
                      : i < step
                        ? "border-brand/30 bg-brand/10 text-brand"
                        : "border-border/60 text-muted-foreground/40"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                {s}
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 mx-2 h-px transition-colors ${
                    i < step ? "bg-brand/30" : "bg-border/60"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {step === 0 && (
            <Step1Target form={form} upd={upd} showToken={showToken} setShowToken={setShowToken} />
          )}
          {step === 1 && <Step2Checks form={form} upd={upd} toggleCheckType={toggleCheckType} />}
          {step === 2 && <Step3Alerts form={form} upd={upd} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 px-5 py-4 shrink-0">
          <button
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-3.5" />
            {step === 0 ? "Cancel" : "Back"}
          </button>

          {step < steps.length - 1 ? (
            <button
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-4 text-xs font-semibold text-brand-foreground hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Continue
              <ChevronRight className="size-3.5" />
            </button>
          ) : (
            <button
              disabled={saving || form.checkTypes.length === 0}
              onClick={handleSave}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-4 text-xs font-semibold text-brand-foreground hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <>
                  <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving…
                </>
              ) : (
                <>
                  <Shield className="size-3.5" />
                  Start monitoring
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Target ──────────────────────────────────────────────────────────

function Step1Target({
  form,
  upd,
  showToken,
  setShowToken,
}: {
  form: MonitoringFormState;
  upd: (p: Partial<MonitoringFormState>) => void;
  showToken: boolean;
  setShowToken: (v: boolean) => void;
}) {
  const [methodOpen, setMethodOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Monitor name */}
      <Field label="Monitor name" required>
        <input
          value={form.name}
          onChange={(e) => upd({ name: e.target.value })}
          placeholder="e.g. Billing API — Invoice endpoint"
          className="text-mono h-9 w-full rounded-md border border-border bg-surface-2/60 px-3 text-xs outline-none focus:border-brand/50 placeholder:text-muted-foreground/50 transition-colors"
        />
      </Field>

      {/* Method + URL */}
      <Field label="Endpoint URL" required>
        <div className="flex items-stretch overflow-visible rounded-md border border-border bg-surface-2/60 focus-within:border-brand/50 transition-colors">
          {/* Method picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMethodOpen((v) => !v)}
              className={`text-mono inline-flex h-9 items-center gap-1 border-r border-border bg-transparent px-2.5 text-[11px] font-bold tracking-wider outline-none hover:bg-accent/30 transition-colors ${METHOD_COLOR[form.method] ?? "text-foreground"}`}
            >
              {form.method}
              <ChevronRight className="size-3 rotate-90 text-muted-foreground" />
            </button>
            {methodOpen && (
              <div className="absolute left-0 top-10 z-20 w-40 overflow-hidden rounded-md border border-border bg-popover shadow-xl">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      upd({ method: m });
                      setMethodOpen(false);
                    }}
                    className={`flex w-full items-center px-3 py-1.5 text-left text-[11px] hover:bg-accent ${form.method === m ? "bg-accent/50" : ""}`}
                  >
                    <span className={`text-mono font-bold ${METHOD_COLOR[m]}`}>{m}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            value={form.url}
            onChange={(e) => upd({ url: e.target.value })}
            placeholder="https://api.example.com/v1/resource"
            className="text-mono h-9 flex-1 bg-transparent px-3 text-xs outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </Field>

      {/* Auth */}
      <Field label="Authentication">
        <div className="space-y-2">
          <select
            value={form.authKind}
            onChange={(e) => upd({ authKind: e.target.value as AuthKind })}
            className="text-mono h-9 w-full rounded-md border border-border bg-surface-2/60 px-3 text-xs outline-none focus:border-brand/50 transition-colors"
          >
            <option value="none">No auth</option>
            <option value="bearer">Bearer token</option>
            <option value="apiKey">API key</option>
            <option value="basic">Basic auth</option>
          </select>

          {form.authKind === "bearer" && (
            <div className="flex items-stretch overflow-hidden rounded-md border border-border bg-surface-2/60 focus-within:border-brand/50 transition-colors">
              <div className="grid place-items-center px-2.5">
                <Lock className="size-3.5 text-muted-foreground" />
              </div>
              <input
                type={showToken ? "text" : "password"}
                value={form.bearerToken}
                onChange={(e) => upd({ bearerToken: e.target.value })}
                placeholder="{{BEARER_TOKEN}}"
                className="text-mono h-9 flex-1 bg-transparent pr-2 text-xs outline-none placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="grid w-8 place-items-center border-l border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          )}

          {form.authKind === "apiKey" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-stretch overflow-hidden rounded-md border border-border bg-surface-2/60 focus-within:border-brand/50 transition-colors col-span-2">
                <div className="grid place-items-center px-2.5">
                  <Key className="size-3.5 text-muted-foreground" />
                </div>
                <input
                  value={form.apiKeyName}
                  onChange={(e) => upd({ apiKeyName: e.target.value })}
                  placeholder="Header name (e.g. X-API-Key)"
                  className="text-mono h-9 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
                />
              </div>
              <input
                value={form.apiKeyValue}
                onChange={(e) => upd({ apiKeyValue: e.target.value })}
                placeholder="Value / {{ENV_VAR}}"
                className="text-mono h-9 rounded-md border border-border bg-surface-2/60 px-3 text-xs outline-none focus:border-brand/50 placeholder:text-muted-foreground/50 transition-colors"
              />
              <select
                value={form.apiKeyIn}
                onChange={(e) => upd({ apiKeyIn: e.target.value as "header" | "query" })}
                className="text-mono h-9 rounded-md border border-border bg-surface-2/60 px-3 text-xs outline-none focus:border-brand/50 transition-colors"
              >
                <option value="header">Header</option>
                <option value="query">Query param</option>
              </select>
            </div>
          )}

          {form.authKind === "basic" && (
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Username"
                className="text-mono h-9 rounded-md border border-border bg-surface-2/60 px-3 text-xs outline-none focus:border-brand/50 placeholder:text-muted-foreground/50 transition-colors"
              />
              <input
                type="password"
                placeholder="Password"
                className="text-mono h-9 rounded-md border border-border bg-surface-2/60 px-3 text-xs outline-none focus:border-brand/50 placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>
          )}
        </div>
      </Field>
    </div>
  );
}

// ─── Step 2: Checks ──────────────────────────────────────────────────────────

function Step2Checks({
  form,
  upd,
  toggleCheckType,
}: {
  form: MonitoringFormState;
  upd: (p: Partial<MonitoringFormState>) => void;
  toggleCheckType: (ct: CheckType) => void;
}) {
  const customInterval =
    !INTERVAL_PRESETS.some((p) => p.value === form.intervalMin) && form.intervalMin !== 5;

  return (
    <div className="space-y-5">
      {/* Check types */}
      <div>
        <label className="text-mono mb-2 block text-[10px] uppercase tracking-widest text-muted-foreground">
          What to check <span className="text-danger">*</span>
        </label>
        <div className="space-y-2">
          {(
            Object.entries(CHECK_TYPE_CONFIG) as [
              CheckType,
              (typeof CHECK_TYPE_CONFIG)[CheckType],
            ][]
          ).map(([ct, cfg]) => {
            const active = form.checkTypes.includes(ct);
            const Icon = cfg.icon;
            const colorMap: Record<string, string> = {
              brand: "border-brand/30 bg-brand/10 text-brand",
              emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
              amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
              violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
            };
            const ringMap: Record<string, string> = {
              brand: "border-brand/40",
              emerald: "border-emerald-500/40",
              amber: "border-amber-500/40",
              violet: "border-violet-500/40",
            };
            return (
              <button
                key={ct}
                type="button"
                onClick={() => toggleCheckType(ct)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  active
                    ? `${ringMap[cfg.color]} bg-surface-2/60`
                    : "border-border/60 bg-surface-2/20 hover:border-border hover:bg-surface-2/40"
                }`}
              >
                <div
                  className={`grid size-8 shrink-0 place-items-center rounded-md border ${
                    active ? colorMap[cfg.color] : "border-border bg-accent text-muted-foreground"
                  } transition-colors`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-medium transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {cfg.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground/70 mt-0.5">{cfg.desc}</div>
                </div>
                <div
                  className={`size-4 shrink-0 rounded-sm border-2 transition-colors flex items-center justify-center ${
                    active ? "border-brand bg-brand" : "border-border"
                  }`}
                >
                  {active && <CheckCircle2 className="size-3 text-brand-foreground" />}
                </div>
              </button>
            );
          })}
        </div>
        {form.checkTypes.length === 0 && (
          <p className="mt-1.5 text-[11px] text-danger">Select at least one check type.</p>
        )}
      </div>

      {/* Content match config */}
      {form.checkTypes.includes("content_match") && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 space-y-2">
          <p className="text-[11px] font-medium text-violet-300">Content match config</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Field path">
              <input
                value={form.contentMatchField}
                onChange={(e) => upd({ contentMatchField: e.target.value })}
                placeholder="e.g. data.status"
                className="text-mono h-8 w-full rounded-md border border-border bg-surface-2/60 px-2.5 text-xs outline-none focus:border-brand/50 placeholder:text-muted-foreground/50 transition-colors"
              />
            </Field>
            <Field label="Expected value">
              <input
                value={form.contentMatchValue}
                onChange={(e) => upd({ contentMatchValue: e.target.value })}
                placeholder="e.g. active"
                className="text-mono h-8 w-full rounded-md border border-border bg-surface-2/60 px-2.5 text-xs outline-none focus:border-brand/50 placeholder:text-muted-foreground/50 transition-colors"
              />
            </Field>
          </div>
        </div>
      )}

      {/* Response time threshold */}
      {form.checkTypes.includes("response_time") && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-[11px] font-medium text-amber-300 mb-2">Response time threshold</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={form.responseTimeThresholdMs}
              onChange={(e) => upd({ responseTimeThresholdMs: Number(e.target.value) || 2000 })}
              min={100}
              step={100}
              className="text-mono h-8 w-28 rounded-md border border-border bg-surface-2/60 px-2.5 text-xs outline-none focus:border-brand/50 transition-colors"
            />
            <span className="text-xs text-muted-foreground">ms — alert if slower</span>
          </div>
        </div>
      )}

      {/* Uptime — expected status */}
      {form.checkTypes.includes("uptime") && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-[11px] font-medium text-emerald-300 mb-2">Expected HTTP status</p>
          <input
            value={form.expectedStatus}
            onChange={(e) => upd({ expectedStatus: e.target.value })}
            placeholder="200"
            className="text-mono h-8 w-28 rounded-md border border-border bg-surface-2/60 px-2.5 text-xs outline-none focus:border-brand/50 placeholder:text-muted-foreground/50 transition-colors"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Any other status triggers an alert
          </p>
        </div>
      )}

      {/* Interval */}
      <div>
        <label className="text-mono mb-2 block text-[10px] uppercase tracking-widest text-muted-foreground">
          Check interval
        </label>
        <div className="flex flex-wrap gap-2">
          {INTERVAL_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => upd({ intervalMin: p.value })}
              className={`text-mono h-8 rounded-md border px-3 text-xs font-medium transition-all ${
                form.intervalMin === p.value
                  ? "border-brand/50 bg-brand/15 text-brand"
                  : "border-border bg-surface-2/40 text-muted-foreground hover:border-border/80 hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={1440}
              value={customInterval ? form.intervalMin : ""}
              onChange={(e) => upd({ intervalMin: Number(e.target.value) || 5 })}
              placeholder="Custom"
              className="text-mono h-8 w-20 rounded-md border border-border bg-surface-2/40 px-2.5 text-xs outline-none focus:border-brand/50 placeholder:text-muted-foreground/50 transition-colors"
            />
            <span className="text-[11px] text-muted-foreground">min</span>
          </div>
        </div>
      </div>

      {/* Timeout */}
      <div>
        <label className="text-mono mb-2 block text-[10px] uppercase tracking-widest text-muted-foreground">
          Request timeout
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={form.timeoutMs}
            onChange={(e) => upd({ timeoutMs: Number(e.target.value) || 8000 })}
            min={500}
            step={500}
            className="text-mono h-8 w-28 rounded-md border border-border bg-surface-2/60 px-2.5 text-xs outline-none focus:border-brand/50 transition-colors"
          />
          <span className="text-[11px] text-muted-foreground">ms — mark as failed if exceeded</span>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Alerts ──────────────────────────────────────────────────────────

function Step3Alerts({
  form,
  upd,
}: {
  form: MonitoringFormState;
  upd: (p: Partial<MonitoringFormState>) => void;
}) {
  // Summary of selected config
  const intervalLabel =
    INTERVAL_PRESETS.find((p) => p.value === form.intervalMin)?.label ?? `${form.intervalMin}m`;

  return (
    <div className="space-y-5">
      {/* Alert trigger */}
      <div>
        <label className="text-mono mb-2 block text-[10px] uppercase tracking-widest text-muted-foreground">
          Alert after
        </label>
        <div className="space-y-1.5">
          {ALERT_ON_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                form.alertOn === opt.value
                  ? "border-brand/40 bg-brand/10"
                  : "border-border/60 bg-surface-2/20 hover:border-border hover:bg-surface-2/40"
              }`}
            >
              <div
                className={`size-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                  form.alertOn === opt.value ? "border-brand" : "border-border"
                }`}
              >
                {form.alertOn === opt.value && <div className="size-2 rounded-full bg-brand" />}
              </div>
              <span
                className={`text-xs font-medium ${
                  form.alertOn === opt.value ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {opt.label}
              </span>
              <input
                type="radio"
                className="sr-only"
                checked={form.alertOn === opt.value}
                onChange={() => upd({ alertOn: opt.value })}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Notification channels */}
      <div>
        <label className="text-mono mb-2 block text-[10px] uppercase tracking-widest text-muted-foreground">
          Notify via
        </label>
        <div className="space-y-2">
          <label
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-all ${
              form.emailAlerts
                ? "border-brand/40 bg-brand/10"
                : "border-border/60 bg-surface-2/20 hover:border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`grid size-8 place-items-center rounded-md border transition-colors ${
                  form.emailAlerts
                    ? "border-brand/30 bg-brand/15 text-brand"
                    : "border-border bg-accent text-muted-foreground"
                }`}
              >
                <Mail className="size-4" />
              </div>
              <div>
                <div className="text-xs font-medium">Email alerts</div>
                <div className="text-[11px] text-muted-foreground">Sent to your account email</div>
              </div>
            </div>
            <Toggle checked={form.emailAlerts} onChange={(v) => upd({ emailAlerts: v })} />
          </label>

          <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-surface-2/10 p-3 opacity-50">
            <div className="grid size-8 place-items-center rounded-md border border-border bg-accent text-muted-foreground">
              <Bell className="size-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Webhook / Slack</div>
              <div className="text-[11px] text-muted-foreground/60">Coming soon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-lg border border-border/60 bg-surface-2/30 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Monitor summary
        </p>
        <div className="space-y-2">
          <SummaryRow
            icon={Globe}
            label="Endpoint"
            value={`${form.method} ${form.url || "—"}`}
            truncate
          />
          <SummaryRow icon={Clock} label="Interval" value={`Every ${intervalLabel}`} />
          <SummaryRow
            icon={Shield}
            label="Checks"
            value={
              form.checkTypes.length === 0
                ? "None selected"
                : form.checkTypes.map((ct) => CHECK_TYPE_CONFIG[ct].label).join(" · ")
            }
          />
          <SummaryRow
            icon={AlertTriangle}
            label="Alert on"
            value={ALERT_ON_OPTIONS.find((o) => o.value === form.alertOn)?.label ?? "—"}
          />
          <SummaryRow icon={Timer} label="Timeout" value={`${form.timeoutMs}ms`} />
        </div>
      </div>
    </div>
  );
}

// ─── Small primitives ─────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-mono mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-brand" : "bg-muted"}`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-background shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  truncate,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-3.5 shrink-0 mt-0.5 text-muted-foreground/60" />
      <span className="text-[11px] text-muted-foreground shrink-0">{label}:</span>
      <span className={`text-mono text-[11px] text-foreground/90 ${truncate ? "truncate" : ""}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAuth(form: MonitoringFormState): EndpointConfig["auth"] {
  if (form.authKind === "bearer") return { kind: "bearer", bearer: form.bearerToken };
  if (form.authKind === "apiKey")
    return {
      kind: "apiKey",
      apiKey: { key: form.apiKeyName, value: form.apiKeyValue, in: form.apiKeyIn },
    };
  if (form.authKind === "basic") return { kind: "basic", basic: { user: "", pass: "" } };
  return { kind: "none" };
}

function buildPostScript(form: MonitoringFormState): string {
  const lines: string[] = [
    "// Auto-generated by SchemaGuard Monitor — edit as needed",
    `pm.test('status is ${form.expectedStatus || "2xx"}', () => {`,
  ];
  if (form.expectedStatus) {
    lines.push(`  pm.expect(res.status).to.equal(${form.expectedStatus});`);
  } else {
    lines.push(`  pm.expect(res.status).to.be.within(200, 299);`);
  }
  lines.push("});");
  if (form.checkTypes.includes("response_time")) {
    lines.push(
      "",
      `pm.test('response time < ${form.responseTimeThresholdMs}ms', () => {`,
      `  pm.expect(res.time).to.be.below(${form.responseTimeThresholdMs});`,
      "});",
    );
  }
  if (form.checkTypes.includes("content_match") && form.contentMatchField) {
    lines.push(
      "",
      `pm.test('${form.contentMatchField} equals ${form.contentMatchValue}', () => {`,
      `  const val = res.body?.${form.contentMatchField.replace(/\./g, "?.")};`,
      `  pm.expect(String(val)).to.equal('${form.contentMatchValue}');`,
      "});",
    );
  }
  return lines.join("\n");
}
