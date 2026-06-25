// Postman-style endpoint builder.
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { proxyApi } from "@/lib/api";
import {
  Save,
  Send,
  Trash2,
  X,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Info,
  FileText,
  Code2,
  Settings2,
  Cookie,
  ShieldCheck,
  KeyRound,
  AlignLeft,
  Share2,
  Download,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Copy,
} from "lucide-react";
import { AppShell, METHOD_COLOR } from "@/components/app/AppShell";
import { EndpointsWorkspace } from "@/components/app/EndpointsWorkspace";
import { CodeEditor } from "@/components/app/CodeEditor";
import {
  useStore,
  store,
  utils,
  type EndpointConfig,
  type KV,
  type AuthKind,
  type BodyKind,
} from "@/lib/store";
import type { Method } from "@/lib/mock";

type Tab =
  | "Params"
  | "Authorization"
  | "Headers"
  | "Body"
  | "Scripts"
  | "Settings"
  | "Docs"
  | "Cookies";
const TABS: Tab[] = [
  "Params",
  "Authorization",
  "Headers",
  "Body",
  "Scripts",
  "Settings",
  "Docs",
  "Cookies",
];
const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};

const AUTO_HEADERS: KV[] = [
  {
    id: "_h_auth",
    key: "Authorization",
    value: "<calculated when request is sent>",
    enabled: true,
  },
  { id: "_h_host", key: "Host", value: "<calculated when request is sent>", enabled: true },
  { id: "_h_ua", key: "User-Agent", value: "SchemaGuard/1.0", enabled: true },
  { id: "_h_acc", key: "Accept", value: "*/*", enabled: true },
  { id: "_h_aenc", key: "Accept-Encoding", value: "gzip, deflate, br", enabled: true },
  { id: "_h_conn", key: "Connection", value: "keep-alive", enabled: true },
];

export function EndpointBuilder({
  initial,
  footer,
  bare = false,
}: {
  initial: EndpointConfig;
  footer?: React.ReactNode;
  bare?: boolean;
}) {
  const navigate = useNavigate();
  const environments = useStore((s) => s.environments);
  const activeEnvId = useStore((s) => s.activeEnvId);
  const activeEnv = environments.find((e) => e.id === activeEnvId);

  const [draft, setDraft] = useState<EndpointConfig>(initial);
  const [tab, setTab] = useState<Tab>("Params");
  const [scriptTab, setScriptTab] = useState<"pre" | "post">("pre");
  const [postScript, setPostScript] = useState<string>(
    "// Runs after every poll. Available: res, schema, pm\n// pm.test('status is 200', () => res.status === 200);\n",
  );
  const [showAutoHeaders, setShowAutoHeaders] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [response, setResponse] = useState<null | {
    status: number;
    time: number;
    size: string;
    body: string;
    headers: Record<string, string>;
    tests: { name: string; pass: boolean }[];
  }>(null);
  const [respTab, setRespTab] = useState<"Pretty" | "Raw" | "Headers" | "Test Results">("Pretty");
  const [schemaOpen, setSchemaOpen] = useState(true);
  const [methodOpen, setMethodOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [customMethod, setCustomMethod] = useState("");
  const methodRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (methodRef.current && !methodRef.current.contains(e.target as Node)) setMethodOpen(false);
      if (sendRef.current && !sendRef.current.contains(e.target as Node)) setSendOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Sync params <-> URL on mount
  useEffect(() => {
    const fromUrl = utils.urlToParams(draft.url);
    if (fromUrl.length && draft.params.every((p) => !p.key)) {
      setDraft((d) => ({ ...d, params: [...fromUrl, utils.newKV()] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onParamsChange = (params: KV[]) => {
    const url = utils.paramsToUrl(draft.url, params);
    setDraft((d) => ({ ...d, params, url }));
  };
  const onUrlChange = (url: string) => {
    setDraft((d) => ({ ...d, url, params: [...utils.urlToParams(url), utils.newKV()] }));
  };

  const save = () => {
    store.upsertEndpoint(draft);
    navigate({ to: "/endpoints/$id", params: { id: draft.id } });
  };

  const runTest = async (download = false) => {
    setTesting(true);
    setResponse(null);
    setSendOpen(false);

    try {
      const resolvedUrl = utils.resolve(draft.url, activeEnv);

      const headers: Record<string, string> = {};
      for (const h of draft.headersKv) {
        if (h.enabled && h.key) headers[h.key] = utils.resolve(h.value, activeEnv);
      }
      if (draft.auth.kind === "bearer" && draft.auth.bearer) {
        headers["Authorization"] = `Bearer ${utils.resolve(draft.auth.bearer, activeEnv)}`;
      }
      if (draft.auth.kind === "basic" && draft.auth.basic?.user) {
        headers["Authorization"] =
          `Basic ${btoa(`${draft.auth.basic.user}:${draft.auth.basic.pass ?? ""}`)}`;
      }
      if (
        draft.auth.kind === "apiKey" &&
        draft.auth.apiKey?.key &&
        (draft.auth.apiKey.in ?? "header") === "header"
      ) {
        headers[draft.auth.apiKey.key] = utils.resolve(draft.auth.apiKey.value, activeEnv);
      }

      const params: Record<string, string> = {};
      for (const p of draft.params) {
        if (p.enabled && p.key) params[p.key] = utils.resolve(p.value, activeEnv);
      }
      if (
        draft.auth.kind === "apiKey" &&
        draft.auth.apiKey?.key &&
        draft.auth.apiKey.in === "query"
      ) {
        params[draft.auth.apiKey.key] = draft.auth.apiKey.value;
      }

      let body: unknown;
      if (draft.body.kind === "json" || draft.body.kind === "raw") {
        const raw = draft.body.raw ?? draft.body.json ?? "";
        try {
          body = JSON.parse(raw);
        } catch {
          body = raw;
        }
      }

      const result = await proxyApi.execute({
        method: draft.method,
        url: resolvedUrl,
        headers,
        params,
        body,
        timeoutMs: draft.timeoutMs,
      });

      setResponse({
        status: result.status,
        time: result.time,
        size: result.size,
        body: result.body,
        headers: result.headers,
        tests: [
          { name: "status is 2xx", pass: result.status >= 200 && result.status < 300 },
          { name: "response time < 500ms", pass: result.time < 500 },
          { name: "request completed without error", pass: !result.error },
        ],
      });

      if (download) {
        const blob = new Blob([result.body], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${draft.name || "response"}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setResponse({
        status: 0,
        time: 0,
        size: "0 KB",
        body: JSON.stringify({ error: err instanceof Error ? err.message : "Request failed" }),
        headers: {},
        tests: [{ name: "request completed", pass: false }],
      });
    } finally {
      setTesting(false);
    }
  };

  const isNew = !useStore((s) => s.endpoints.find((e) => e.id === draft.id));

  // ── Tab indicators (Postman-style dots / counts) ─────────────────────────
  const indicators = useMemo(() => {
    const activeParams = draft.params.filter((p) => p.enabled && p.key).length;
    const activeHeaders = draft.headersKv.filter((h) => h.enabled && h.key).length;
    const hasAuth = draft.auth.kind !== "none";
    const hasBody = draft.body.kind !== "none";
    const hasScripts = draft.preScript.trim().length > 80 || postScript.trim().length > 80;
    return { activeParams, activeHeaders, hasAuth, hasBody, hasScripts };
  }, [draft, postScript]);

  const tabBadge = (t: Tab): React.ReactNode => {
    if (t === "Params" && indicators.activeParams)
      return <CountPill>{indicators.activeParams}</CountPill>;
    if (t === "Headers") {
      const n = indicators.activeHeaders + (showAutoHeaders ? AUTO_HEADERS.length : 0);
      return n ? <CountPill>{n}</CountPill> : null;
    }
    if (t === "Authorization" && indicators.hasAuth) return <Dot />;
    if (t === "Body" && indicators.hasBody) return <Dot />;
    if (t === "Scripts" && indicators.hasScripts) return <Dot />;
    return null;
  };

  const content = (
    <>
      {/* ── Breadcrumb + Save/Share bar ─────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span>SchemaGuard</span>
          <ChevronRight className="size-3" />
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Untitled request"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Share2 className="size-3.5" /> Share
          </button>
          <button
            onClick={save}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 text-xs font-semibold text-foreground hover:bg-accent"
          >
            <Save className="size-3.5" /> Save
          </button>
        </div>
      </div>

      {/* ── URL bar (Postman-style) ─────────────────────────────────── */}
      <div className="mt-4 flex items-stretch overflow-visible rounded-md border border-border bg-surface-2/60 focus-within:border-brand/50">
        {/* Method dropdown (custom) */}
        <div ref={methodRef} className="relative">
          <button
            type="button"
            onClick={() => setMethodOpen((v) => !v)}
            className={`text-mono inline-flex h-10 items-center gap-1.5 border-r border-border bg-transparent px-3 text-[12px] font-bold tracking-wider outline-none hover:bg-accent/30 ${METHOD_COLOR[draft.method] ?? "text-foreground"}`}
          >
            {draft.method}
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>
          {methodOpen && (
            <div className="absolute left-0 top-11 z-20 w-56 overflow-hidden rounded-md border border-border bg-popover shadow-xl animate-fade-in">
              <div className="text-mono border-b border-border/60 bg-surface-2/40 px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                HTTP method
              </div>
              {METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setDraft((d) => ({ ...d, method: m }));
                    setMethodOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[12px] hover:bg-accent ${
                    draft.method === m ? "bg-accent/50" : ""
                  }`}
                >
                  <span className={`text-mono font-bold tracking-wider ${METHOD_COLOR[m]}`}>
                    {m}
                  </span>
                  {draft.method === m && <CheckCircle2 className="size-3 text-brand" />}
                </button>
              ))}
              <div className="border-t border-border/60 p-2">
                <input
                  value={customMethod}
                  onChange={(e) => setCustomMethod(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customMethod.trim()) {
                      setDraft((d) => ({ ...d, method: customMethod.trim() as Method }));
                      setCustomMethod("");
                      setMethodOpen(false);
                    }
                  }}
                  placeholder="Type a new method"
                  className="text-mono h-7 w-full rounded border border-border bg-surface-2/60 px-2 text-[11px] outline-none focus:border-brand/50"
                />
              </div>
            </div>
          )}
        </div>

        {/* URL input with {{var}} highlight overlay */}
        <div className="relative flex-1">
          <div
            aria-hidden
            className="text-mono pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre px-3 text-xs text-transparent"
          >
            {highlightVars(draft.url)}
          </div>
          <input
            value={draft.url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="{{BASE_URL}}/v2/resource"
            spellCheck={false}
            className="text-mono relative h-10 w-full bg-transparent px-3 text-xs caret-foreground outline-none placeholder:text-muted-foreground/50"
            style={{ color: "transparent", WebkitTextFillColor: "transparent" }}
          />
        </div>

        {/* Send (split) */}
        <div ref={sendRef} className="relative flex">
          <button
            onClick={() => runTest(false)}
            disabled={testing}
            className="inline-flex items-center gap-1.5 border-l border-border bg-brand px-4 text-xs font-semibold text-brand-foreground transition-colors hover:brightness-110 disabled:opacity-50"
          >
            <Send className="size-3.5" /> {testing ? "Sending…" : "Send"}
          </button>
          <button
            onClick={() => setSendOpen((v) => !v)}
            disabled={testing}
            aria-label="Send options"
            className="inline-flex w-7 items-center justify-center border-l border-brand-foreground/20 bg-brand text-brand-foreground hover:brightness-110 disabled:opacity-50"
          >
            <ChevronDown className="size-3" />
          </button>
          {sendOpen && (
            <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-md border border-border bg-popover shadow-xl animate-fade-in">
              <button
                onClick={() => runTest(true)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent"
              >
                <Download className="size-3.5" /> Send and Download
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="mt-4 border-b border-border/60">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative inline-flex h-9 items-center gap-1.5 px-3 text-xs font-medium transition-colors ${
                tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {tabBadge(t)}
              {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-brand" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab body ────────────────────────────────────────────────── */}
      <div className="mt-4 animate-fade-in">
        {tab === "Params" && (
          <KvTable
            rows={draft.params}
            setRows={onParamsChange}
            keyLabel="Key"
            valLabel="Value"
            hint="Query params sync with the URL above."
          />
        )}
        {tab === "Headers" && (
          <HeadersTab
            rows={draft.headersKv}
            setRows={(rows) => setDraft((d) => ({ ...d, headersKv: rows }))}
            showAuto={showAutoHeaders}
            setShowAuto={setShowAutoHeaders}
          />
        )}
        {tab === "Authorization" && (
          <AuthTab
            auth={draft.auth}
            setAuth={(auth) => setDraft((d) => ({ ...d, auth }))}
            showToken={showToken}
            setShowToken={setShowToken}
          />
        )}
        {tab === "Body" && (
          <BodyTab body={draft.body} setBody={(body) => setDraft((d) => ({ ...d, body }))} />
        )}
        {tab === "Scripts" && (
          <ScriptsTab
            tab={scriptTab}
            setTab={setScriptTab}
            pre={draft.preScript}
            setPre={(v) => setDraft((d) => ({ ...d, preScript: v }))}
            post={postScript}
            setPost={setPostScript}
          />
        )}
        {tab === "Settings" && <SettingsTab draft={draft} setDraft={setDraft} />}
        {tab === "Docs" && <DocsTab draft={draft} setDraft={setDraft} />}
        {tab === "Cookies" && <CookiesTab />}
      </div>

      {/* ── Response panel (inline) ─────────────────────────────────── */}
      {!testing && !response && (
        <section className="mt-8 grid place-items-center rounded-lg border border-dashed border-border/60 bg-surface-2/20 py-12 animate-fade-in">
          <div className="space-y-2 text-center">
            <p className="text-mono text-[11px] text-muted-foreground">
              <Send className="mr-1.5 inline size-3 text-brand" /> Send + Get a successful response
            </p>
            <p className="text-mono text-[11px] text-muted-foreground">
              <ShieldCheck className="mr-1.5 inline size-3 text-brand" /> Send + Visualize response
            </p>
            <p className="text-mono text-[11px] text-muted-foreground">
              <Code2 className="mr-1.5 inline size-3 text-brand" /> Send + Write tests
            </p>
          </div>
        </section>
      )}
      {(testing || response) && (
        <section className="mt-6 overflow-hidden rounded-lg border border-border/60 bg-surface-2/40 animate-fade-up">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-2.5">
            <span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Response
            </span>
            {testing && (
              <span className="text-mono text-[11px] text-muted-foreground">running…</span>
            )}
            {response && (
              <>
                <StatusBadge status={response.status} />
                <span className="text-mono text-[11px] text-muted-foreground">
                  Time: <span className="text-foreground">{response.time} ms</span>
                </span>
                <span className="text-mono text-[11px] text-muted-foreground">
                  Size: <span className="text-foreground">{response.size}</span>
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => {
                      const blob = new Blob([response.body], { type: "application/json" });
                      const u = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = u;
                      a.download = `${draft.name || "response"}.json`;
                      a.click();
                      URL.revokeObjectURL(u);
                    }}
                    className="inline-flex h-7 items-center gap-1 rounded border border-border bg-surface-2 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <Download className="size-3" /> Save Response
                  </button>
                  <button
                    onClick={() => navigator.clipboard?.writeText(response.body)}
                    aria-label="Copy"
                    className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    aria-label="More"
                    className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setResponse(null)}
                    aria-label="Close"
                    className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
          {response && (
            <>
              <div className="flex gap-0 border-b border-border/60 px-2">
                {(["Pretty", "Raw", "Headers", "Test Results"] as const).map((rt) => {
                  const passed = response.tests.filter((t) => t.pass).length;
                  const failed = response.tests.length - passed;
                  return (
                    <button
                      key={rt}
                      onClick={() => setRespTab(rt)}
                      className={`relative inline-flex h-8 items-center gap-1.5 px-3 text-[11px] font-medium ${respTab === rt ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {rt}
                      {rt === "Test Results" && (
                        <span className="text-mono inline-flex items-center gap-1 text-[10px]">
                          <span className="text-emerald-300">{passed}</span>/
                          <span className="text-rose-300">{failed}</span>
                        </span>
                      )}
                      {respTab === rt && (
                        <span className="absolute inset-x-2 -bottom-px h-0.5 bg-brand" />
                      )}
                    </button>
                  );
                })}
                <div className="ml-auto flex items-center px-2 text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  application/json
                </div>
              </div>
              <div className="max-h-[52vh] overflow-auto p-3">
                {respTab === "Pretty" && <JsonTree json={response.body} />}
                {respTab === "Raw" && (
                  <pre className="text-mono whitespace-pre-wrap break-all text-[12px] leading-5">
                    {response.body}
                  </pre>
                )}
                {respTab === "Headers" && (
                  <table className="w-full text-xs">
                    <tbody>
                      {Object.entries(response.headers).map(([k, v]) => (
                        <tr key={k} className="border-b border-border/40 last:border-0">
                          <td className="text-mono py-1.5 pr-4 text-muted-foreground">{k}</td>
                          <td className="text-mono py-1.5">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {respTab === "Test Results" && (
                  <ul className="divide-y divide-border/40">
                    {response.tests.map((t, i) => (
                      <li key={i} className="flex items-center gap-2 py-2 text-xs">
                        {t.pass ? (
                          <CheckCircle2 className="size-3.5 text-emerald-300" />
                        ) : (
                          <XCircle className="size-3.5 text-rose-300" />
                        )}
                        <span className={t.pass ? "text-foreground" : "text-rose-300"}>
                          {t.name}
                        </span>
                        <span
                          className={`text-mono ml-auto rounded px-1.5 text-[10px] ${t.pass ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}
                        >
                          {t.pass ? "PASS" : "FAIL"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* SchemaGuard-specific schema preview (collapsible) */}
              <div className="border-t border-border/60">
                <button
                  onClick={() => setSchemaOpen((v) => !v)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-accent/20"
                >
                  <ChevronDown
                    className={`size-3 transition-transform ${schemaOpen ? "" : "-rotate-90"}`}
                  />
                  <ShieldCheck className="size-3 text-brand" /> SchemaGuard · Extracted schema
                </button>
                {schemaOpen && (
                  <div className="px-4 pb-3">
                    <SchemaPreview body={response.body} />
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}
      {footer}
    </>
  );

  if (bare) return content;

  return (
    <AppShell
      title={isNew ? "New request" : draft.name}
      subtitle={isNew ? "Build & monitor a new endpoint" : draft.url}
      actions={
        <Link
          to="/endpoints"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back
        </Link>
      }
    >
      <EndpointsWorkspace>{content}</EndpointsWorkspace>
    </AppShell>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function KvTable({
  rows,
  setRows,
  keyLabel,
  valLabel,
  hint,
}: {
  rows: KV[];
  setRows: (r: KV[]) => void;
  keyLabel: string;
  valLabel: string;
  hint?: string;
}) {
  const update = (i: number, patch: Partial<KV> & { description?: string }) => {
    const next = rows.map((r, idx) => (idx === i ? ({ ...r, ...patch } as KV) : r));
    if (i === rows.length - 1 && (patch.key || patch.value)) next.push(utils.newKV());
    setRows(next);
  };
  const remove = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const ensureRow = () => {
    if (rows.length === 0) setRows([utils.newKV()]);
  };

  return (
    <div>
      {hint && (
        <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Info className="size-3" /> {hint}
        </div>
      )}
      <div className="overflow-hidden rounded-md border border-border/60">
        <div className="text-mono grid grid-cols-[28px_1.2fr_1.4fr_1.4fr_28px] border-b border-border/60 bg-surface-2/40 text-[10px] uppercase tracking-widest text-muted-foreground">
          <div className="px-2 py-2 text-center">On</div>
          <div className="px-3 py-2">{keyLabel}</div>
          <div className="px-3 py-2">{valLabel}</div>
          <div className="px-3 py-2">Description</div>
          <div />
        </div>
        {rows.length === 0 && (
          <button
            onClick={ensureRow}
            className="block w-full px-3 py-3 text-left text-xs text-muted-foreground hover:bg-accent/30"
          >
            + Add row
          </button>
        )}
        {rows.map((r, i) => (
          <div
            key={r.id}
            className="grid grid-cols-[28px_1.2fr_1.4fr_1.4fr_28px] border-b border-border/40 last:border-0 hover:bg-accent/20"
          >
            <div className="grid place-items-center">
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={(e) => update(i, { enabled: e.target.checked })}
                className="size-3 accent-[color:var(--brand)]"
              />
            </div>
            <input
              value={r.key}
              onChange={(e) => update(i, { key: e.target.value })}
              className="text-mono h-8 w-full bg-transparent px-3 text-xs outline-none placeholder:text-muted-foreground/40"
              placeholder="key"
            />
            <input
              value={r.value}
              onChange={(e) => update(i, { value: e.target.value })}
              className="text-mono h-8 w-full bg-transparent px-3 text-xs outline-none placeholder:text-muted-foreground/40"
              placeholder="value"
            />
            <input
              defaultValue={(r as KV & { description?: string }).description ?? ""}
              onBlur={(e) =>
                update(i, { description: e.target.value } as KV & { description?: string })
              }
              className="text-mono h-8 w-full bg-transparent px-3 text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/30"
              placeholder="—"
            />
            <button
              onClick={() => remove(i)}
              aria-label="Remove"
              className="grid place-items-center text-muted-foreground hover:text-danger"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{rows.filter((r) => r.enabled && r.key).length} active</span>
        <button className="text-mono text-[11px] hover:text-foreground">Bulk Edit</button>
      </div>
    </div>
  );
}

function HeadersTab({
  rows,
  setRows,
  showAuto,
  setShowAuto,
}: {
  rows: KV[];
  setRows: (r: KV[]) => void;
  showAuto: boolean;
  setShowAuto: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Info className="size-3" /> Auto-generated headers are added at send time.
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={!showAuto}
            onChange={(e) => setShowAuto(!e.target.checked)}
            className="size-3 accent-[color:var(--brand)]"
          />
          Hide auto-generated headers
        </label>
      </div>
      {showAuto && (
        <div className="mb-3 overflow-hidden rounded-md border border-dashed border-border/60 bg-surface-2/20">
          <div className="text-mono border-b border-border/40 bg-surface-2/40 px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            Auto · {AUTO_HEADERS.length}
          </div>
          {AUTO_HEADERS.map((h) => (
            <div
              key={h.id}
              className="grid grid-cols-[28px_1.2fr_1.4fr_28px] border-b border-border/40 last:border-0"
            >
              <div className="grid place-items-center">
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="size-3 accent-[color:var(--brand)]"
                />
              </div>
              <div className="text-mono px-3 py-1.5 text-[11px] text-foreground/80">{h.key}</div>
              <div className="text-mono px-3 py-1.5 text-[11px] text-muted-foreground italic">
                {h.value}
              </div>
              <div />
            </div>
          ))}
        </div>
      )}
      <KvTable rows={rows} setRows={setRows} keyLabel="Header" valLabel="Value" />
    </div>
  );
}

function AuthTab({
  auth,
  setAuth,
  showToken,
  setShowToken,
}: {
  auth: EndpointConfig["auth"];
  setAuth: (a: EndpointConfig["auth"]) => void;
  showToken: boolean;
  setShowToken: (v: boolean) => void;
}) {
  const kinds: { id: AuthKind; label: string; hint: string }[] = [
    {
      id: "none",
      label: "No Auth",
      hint: "This request will not include any authentication credentials.",
    },
    {
      id: "bearer",
      label: "Bearer Token",
      hint: "Bearer tokens are sent in the Authorization header as 'Bearer <token>'.",
    },
    {
      id: "basic",
      label: "Basic Auth",
      hint: "Username & password encoded as base64 in the Authorization header.",
    },
    {
      id: "apiKey",
      label: "API Key",
      hint: "Send the key as a header or a query parameter on each request.",
    },
  ];
  const current = kinds.find((k) => k.id === auth.kind)!;
  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <div>
        <Field label="Auth Type" icon={KeyRound}>
          <select
            value={auth.kind}
            onChange={(e) => setAuth({ ...auth, kind: e.target.value as AuthKind })}
            className="text-mono h-9 w-full rounded-md border border-border bg-surface-2/60 px-3 text-xs outline-none focus:border-brand/50"
          >
            {kinds.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{current.hint}</p>
      </div>
      <div className="rounded-md border border-border/60 bg-surface-2/30 p-4">
        {auth.kind === "none" && (
          <p className="text-xs text-muted-foreground">No authentication selected.</p>
        )}
        {auth.kind === "bearer" && (
          <Field label="Token">
            <div className="flex items-stretch overflow-hidden rounded-md border border-border bg-surface-2/60 focus-within:border-brand/50">
              <input
                type={showToken ? "text" : "password"}
                value={auth.bearer ?? ""}
                onChange={(e) => setAuth({ ...auth, bearer: e.target.value })}
                placeholder="{{API_TOKEN}}"
                className="text-mono h-9 w-full bg-transparent px-3 text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                aria-label={showToken ? "Hide" : "Show"}
                className="grid w-9 place-items-center border-l border-border text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </Field>
        )}
        {auth.kind === "apiKey" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Key">
              <InputField
                value={auth.apiKey?.key ?? ""}
                onChange={(v) =>
                  setAuth({
                    ...auth,
                    apiKey: {
                      key: v,
                      value: auth.apiKey?.value ?? "",
                      in: auth.apiKey?.in ?? "header",
                    },
                  })
                }
                placeholder="X-Api-Key"
              />
            </Field>
            <Field label="Value">
              <InputField
                value={auth.apiKey?.value ?? ""}
                onChange={(v) =>
                  setAuth({
                    ...auth,
                    apiKey: {
                      key: auth.apiKey?.key ?? "",
                      value: v,
                      in: auth.apiKey?.in ?? "header",
                    },
                  })
                }
                placeholder="{{API_KEY}}"
              />
            </Field>
            <Field label="Add to">
              <select
                value={auth.apiKey?.in ?? "header"}
                onChange={(e) =>
                  setAuth({
                    ...auth,
                    apiKey: {
                      key: auth.apiKey?.key ?? "",
                      value: auth.apiKey?.value ?? "",
                      in: e.target.value as "header" | "query",
                    },
                  })
                }
                className="text-mono h-9 w-full rounded-md border border-border bg-surface-2/60 px-3 text-xs outline-none focus:border-brand/50"
              >
                <option value="header">Header</option>
                <option value="query">Query Params</option>
              </select>
            </Field>
          </div>
        )}
        {auth.kind === "basic" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Username">
              <InputField
                value={auth.basic?.user ?? ""}
                onChange={(v) =>
                  setAuth({ ...auth, basic: { user: v, pass: auth.basic?.pass ?? "" } })
                }
              />
            </Field>
            <Field label="Password">
              <InputField
                type="password"
                value={auth.basic?.pass ?? ""}
                onChange={(v) =>
                  setAuth({ ...auth, basic: { user: auth.basic?.user ?? "", pass: v } })
                }
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

function BodyTab({
  body,
  setBody,
}: {
  body: EndpointConfig["body"];
  setBody: (b: EndpointConfig["body"]) => void;
}) {
  const kinds: { id: BodyKind | "binary" | "graphql"; label: string }[] = [
    { id: "none", label: "none" },
    { id: "form-data", label: "form-data" },
    { id: "x-www-form-urlencoded", label: "x-www-form-urlencoded" },
    { id: "raw", label: "raw" },
    { id: "binary", label: "binary" },
    { id: "graphql", label: "GraphQL" },
  ];
  const [rawLang, setRawLang] = useState<"JSON" | "Text" | "HTML" | "XML" | "JavaScript">("JSON");
  const isBinary = (body as { kind: string }).kind === "binary";
  const isGraphQL = (body as { kind: string }).kind === "graphql";
  const [gql, setGql] = useState({
    query: "query {\n  invoices(limit: 10) {\n    id\n    total_due\n  }\n}",
    vars: "{\n  \n}",
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md border border-border/60 bg-surface-2/30 px-3 py-2">
        {kinds.map((k) => (
          <label key={k.id} className="inline-flex cursor-pointer items-center gap-1.5 text-[12px]">
            <input
              type="radio"
              name="body"
              checked={(body as { kind: string }).kind === k.id}
              onChange={() =>
                setBody({ ...(body as EndpointConfig["body"]), kind: k.id as BodyKind })
              }
              className="accent-[color:var(--brand)]"
            />
            <span
              className={
                (body as { kind: string }).kind === k.id
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              {k.label}
            </span>
          </label>
        ))}
        {body.kind === "raw" && (
          <select
            value={rawLang}
            onChange={(e) => setRawLang(e.target.value as typeof rawLang)}
            className="text-mono ml-auto h-7 rounded-md border border-border bg-surface-2/60 px-2 text-[11px] outline-none"
          >
            {["JSON", "Text", "HTML", "XML", "JavaScript"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        )}
      </div>

      {body.kind === "none" && (
        <div className="grid place-items-center rounded-md border border-dashed border-border/60 bg-surface-2/20 py-12 text-xs text-muted-foreground">
          This request does not have a body.
        </div>
      )}
      {body.kind === "raw" && (
        <CodeEditor
          language={rawLang === "JavaScript" ? "javascript" : "json"}
          value={body.raw ?? body.json ?? ""}
          onChange={(v) => setBody({ ...body, raw: v })}
        />
      )}
      {(body.kind === "form-data" || body.kind === "x-www-form-urlencoded") && (
        <KvTable
          rows={(body.kind === "form-data" ? body.form : body.urlencoded) ?? []}
          setRows={(rows) =>
            setBody(
              body.kind === "form-data" ? { ...body, form: rows } : { ...body, urlencoded: rows },
            )
          }
          keyLabel="Field"
          valLabel="Value"
        />
      )}
      {isBinary && (
        <div className="grid place-items-center rounded-md border border-dashed border-border/60 bg-surface-2/20 py-10 text-xs text-muted-foreground">
          <div className="text-center">
            <FileText className="mx-auto mb-2 size-5" />
            Drop a file or{" "}
            <button className="text-brand underline-offset-2 hover:underline">choose</button> to
            upload as binary body.
          </div>
        </div>
      )}
      {isGraphQL && (
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <div className="text-mono mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              Query
            </div>
            <CodeEditor
              language="javascript"
              value={gql.query}
              onChange={(v) => setGql((g) => ({ ...g, query: v }))}
            />
          </div>
          <div>
            <div className="text-mono mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              Variables
            </div>
            <CodeEditor
              language="json"
              value={gql.vars}
              onChange={(v) => setGql((g) => ({ ...g, vars: v }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ScriptsTab({
  tab,
  setTab,
  pre,
  setPre,
  post,
  setPost,
}: {
  tab: "pre" | "post";
  setTab: (t: "pre" | "post") => void;
  pre: string;
  setPre: (v: string) => void;
  post: string;
  setPost: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-3 inline-flex rounded-md border border-border bg-surface-2/40 p-1">
        {[
          { id: "pre" as const, label: "Pre-request", icon: AlignLeft },
          { id: "post" as const, label: "Post-response", icon: Code2 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex h-7 items-center gap-1.5 rounded px-3 text-[11px] font-medium transition-colors ${
              tab === t.id
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="size-3" /> {t.label}
          </button>
        ))}
      </div>
      <p className="mb-2 text-[11px] text-muted-foreground">
        {tab === "pre" ? (
          <>
            JavaScript executed before each poll. Available:{" "}
            <code className="text-mono text-foreground">req</code>,{" "}
            <code className="text-mono text-foreground">env</code>,{" "}
            <code className="text-mono text-foreground">console</code>
          </>
        ) : (
          <>
            Executed after each response. Available:{" "}
            <code className="text-mono text-foreground">res</code>,{" "}
            <code className="text-mono text-foreground">schema</code>,{" "}
            <code className="text-mono text-foreground">pm.test()</code>
          </>
        )}
      </p>
      {tab === "pre" ? (
        <CodeEditor language="javascript" value={pre} onChange={setPre} />
      ) : (
        <CodeEditor language="javascript" value={post} onChange={setPost} />
      )}
    </div>
  );
}

function SettingsTab({
  draft,
  setDraft,
}: {
  draft: EndpointConfig;
  setDraft: React.Dispatch<React.SetStateAction<EndpointConfig>>;
}) {
  const collections = useStore((s) => s.collections);
  const [tagInput, setTagInput] = useState("");
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Polling interval (min)" icon={Settings2}>
        <InputField
          type="number"
          value={String(draft.intervalMin)}
          onChange={(v) => setDraft((d) => ({ ...d, intervalMin: Math.max(1, Number(v) || 1) }))}
        />
      </Field>
      <Field label="Timeout (ms)">
        <InputField
          type="number"
          value={String(draft.timeoutMs)}
          onChange={(v) => setDraft((d) => ({ ...d, timeoutMs: Math.max(500, Number(v) || 1000) }))}
        />
      </Field>
      <Field label="Collection">
        <select
          value={draft.collectionId ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, collectionId: e.target.value || null }))}
          className="text-mono h-9 w-full rounded-md border border-border bg-surface-2/60 px-3 text-xs outline-none focus:border-brand/50"
        >
          <option value="">— Unassigned —</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Tags">
        <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface-2/60 p-1.5">
          {draft.tags.map((t) => (
            <span
              key={t}
              className="text-mono inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[10px]"
            >
              {t}
              <button
                onClick={() => setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== t) }))}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                e.preventDefault();
                setDraft((d) => ({ ...d, tags: [...new Set([...d.tags, tagInput.trim()])] }));
                setTagInput("");
              }
            }}
            placeholder="Add tag…"
            className="text-mono min-w-[80px] flex-1 bg-transparent px-1 text-xs outline-none placeholder:text-muted-foreground/40"
          />
        </div>
      </Field>
      <Toggle
        label="Follow redirects"
        checked={draft.followRedirects}
        onChange={(v) => setDraft((d) => ({ ...d, followRedirects: v }))}
      />
      <Toggle
        label="SSL verification"
        checked={draft.sslVerify}
        onChange={(v) => setDraft((d) => ({ ...d, sslVerify: v }))}
      />
      <Toggle
        label="Enable monitoring"
        checked={draft.status !== "paused"}
        onChange={(v) => setDraft((d) => ({ ...d, status: v ? "healthy" : "paused" }))}
      />
    </div>
  );
}

function DocsTab({
  draft,
  setDraft,
}: {
  draft: EndpointConfig;
  setDraft: React.Dispatch<React.SetStateAction<EndpointConfig>>;
}) {
  const [doc, setDoc] = useState<string>(
    `# ${draft.name}\n\nDescribe what this endpoint returns, owners, SLAs, and any drift-handling notes.\n`,
  );
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <CodeEditor language="javascript" value={doc} onChange={setDoc} minRows={14} />
      <div className="rounded-md border border-border/60 bg-surface-2/30 p-3">
        <div className="text-mono mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Quick reference
        </div>
        <ul className="space-y-1.5 text-[11px] text-muted-foreground">
          <li>
            Use <code className="text-mono text-foreground">{`{{VAR}}`}</code> to insert env
            variables.
          </li>
          <li>Baseline is captured on first successful response.</li>
          <li>Drift is detected on schema change against baseline.</li>
        </ul>
      </div>
    </div>
  );
}

function CookiesTab() {
  return (
    <div className="grid place-items-center rounded-md border border-dashed border-border/60 bg-surface-2/20 py-14">
      <div className="text-center">
        <Cookie className="mx-auto mb-2 size-5 text-muted-foreground" />
        <div className="text-sm font-medium">No cookies yet</div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Cookies captured from responses will appear here.
        </p>
      </div>
    </div>
  );
}

// ─── Small primitives ───────────────────────────────────────────────────────

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-mono mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {Icon && <Icon className="size-3" />} {label}
      </span>
      {children}
    </label>
  );
}
function InputField({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="text-mono h-9 w-full rounded-md border border-border bg-surface-2/60 px-3 text-xs outline-none focus:border-brand/50"
    />
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex h-9 cursor-pointer items-center justify-between rounded-md border border-border bg-surface-2/60 px-3">
      <span className="text-xs">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-4 w-7 rounded-full transition-colors ${checked ? "bg-brand" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 size-3 rounded-full bg-background transition-transform ${checked ? "translate-x-3.5" : "translate-x-0.5"}`}
        />
      </button>
    </label>
  );
}
function Dot() {
  return (
    <span className="ml-0.5 inline-block size-1.5 rounded-full bg-brand shadow-[0_0_6px] shadow-brand/60" />
  );
}
function CountPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-mono inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold tracking-wider text-foreground/80">
      {children}
    </span>
  );
}
function StatusBadge({ status }: { status: number }) {
  const cls =
    status < 300
      ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
      : status < 400
        ? "text-amber-300 bg-amber-500/10 border-amber-500/20"
        : "text-rose-300 bg-rose-500/10 border-rose-500/20";
  const label = STATUS_TEXT[status] ?? (status < 300 ? "OK" : "Error");
  return (
    <span
      className={`text-mono inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-semibold tracking-wider ${cls}`}
    >
      {status} {label}
    </span>
  );
}

/** Render URL with {{var}} tokens highlighted (used as transparent-text overlay). */
function highlightVars(url: string): React.ReactNode {
  const parts = url.split(/(\{\{\w+\}\})/g);
  return parts.map((p, i) =>
    /^\{\{\w+\}\}$/.test(p) ? (
      <span
        key={i}
        style={{ color: "oklch(0.75 0.15 60)", WebkitTextFillColor: "oklch(0.75 0.15 60)" }}
      >
        {p}
      </span>
    ) : (
      <span
        key={i}
        style={{ color: "var(--foreground)", WebkitTextFillColor: "var(--foreground)" }}
      >
        {p}
      </span>
    ),
  );
}

// ─── JSON tree (pretty) ─────────────────────────────────────────────────────

function JsonTree({ json }: { json: string }) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return <pre className="text-mono text-[12px]">{json}</pre>;
  }
  return (
    <div className="text-mono text-[12px] leading-5">
      <Node value={parsed} keyName={null} depth={0} last />
    </div>
  );
}
function Node({
  value,
  keyName,
  depth,
  last,
}: {
  value: unknown;
  keyName: string | null;
  depth: number;
  last: boolean;
}) {
  const [open, setOpen] = useState(depth < 3);
  const pad = { paddingLeft: depth * 14 } as const;
  const renderKey = keyName !== null && <span className="text-sky-300">"{keyName}"</span>;
  const colon = keyName !== null && <span className="text-muted-foreground">: </span>;
  const comma = !last && <span className="text-muted-foreground">,</span>;

  if (value === null)
    return (
      <div style={pad}>
        {renderKey}
        {colon}
        <span className="text-rose-300">null</span>
        {comma}
      </div>
    );
  if (Array.isArray(value)) {
    return (
      <>
        <div style={pad} className="cursor-pointer select-none" onClick={() => setOpen(!open)}>
          <span className="mr-1 text-muted-foreground">{open ? "▾" : "▸"}</span>
          {renderKey}
          {colon}
          <span className="text-muted-foreground">[</span>
          {!open && <span className="text-muted-foreground"> {value.length} </span>}
          {!open && <span className="text-muted-foreground">]</span>}
          {!open && comma}
        </div>
        {open &&
          value.map((v, i) => (
            <Node
              key={i}
              value={v}
              keyName={String(i)}
              depth={depth + 1}
              last={i === value.length - 1}
            />
          ))}
        {open && (
          <div style={pad}>
            <span className="text-muted-foreground">]</span>
            {comma}
          </div>
        )}
      </>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <>
        <div style={pad} className="cursor-pointer select-none" onClick={() => setOpen(!open)}>
          <span className="mr-1 text-muted-foreground">{open ? "▾" : "▸"}</span>
          {renderKey}
          {colon}
          <span className="text-muted-foreground">{"{"}</span>
          {!open && <span className="text-muted-foreground"> {entries.length} </span>}
          {!open && <span className="text-muted-foreground">{"}"}</span>}
          {!open && comma}
        </div>
        {open &&
          entries.map(([k, v], i) => (
            <Node key={k} value={v} keyName={k} depth={depth + 1} last={i === entries.length - 1} />
          ))}
        {open && (
          <div style={pad}>
            <span className="text-muted-foreground">{"}"}</span>
            {comma}
          </div>
        )}
      </>
    );
  }
  const t = typeof value;
  const cls =
    t === "string"
      ? "text-emerald-300"
      : t === "number"
        ? "text-amber-300"
        : t === "boolean"
          ? "text-violet-300"
          : "text-foreground";
  const text = t === "string" ? `"${value as string}"` : String(value);
  return (
    <div style={pad}>
      {renderKey}
      {colon}
      <span className={cls}>{text}</span>
      {comma}
    </div>
  );
}

function SchemaPreview({ body }: { body: string }) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return <p className="text-mono text-xs text-danger">Body is not valid JSON.</p>;
  }
  const rows: { path: string; type: string }[] = [];
  const walk = (v: unknown, path: string) => {
    if (v === null) {
      rows.push({ path, type: "null" });
      return;
    }
    if (Array.isArray(v)) {
      rows.push({ path, type: `array[${v.length}]` });
      if (v[0] !== undefined) walk(v[0], `${path}[0]`);
      return;
    }
    if (typeof v === "object") {
      for (const k of Object.keys(v as object))
        walk((v as Record<string, unknown>)[k], path ? `${path}.${k}` : k);
      return;
    }
    rows.push({ path, type: typeof v });
  };
  walk(parsed, "");
  return (
    <div className="overflow-hidden rounded-md border border-border/60">
      <div className="grid grid-cols-[1.5fr_1fr] border-b border-border/40 bg-surface-2/40 px-3 py-1.5 text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Field</span>
        <span>Type</span>
      </div>
      <div className="max-h-48 overflow-auto">
        {rows.map((r) => (
          <div
            key={r.path}
            className="grid grid-cols-[1.5fr_1fr] border-b border-border/30 px-3 py-1 last:border-0 hover:bg-accent/20"
          >
            <span className="text-mono text-[11px] text-foreground/90">{r.path}</span>
            <span className="text-mono text-[11px] text-muted-foreground">{r.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
