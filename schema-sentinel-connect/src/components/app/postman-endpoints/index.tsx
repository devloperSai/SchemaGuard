import { useState, type ReactNode } from "react";
import { AUTO_HEADERS } from "./constants";
import { initialState } from "./constants";
import { CountPill, Dot } from "./primitives";
import { ResponsePanel } from "./ResponsePanel";
import { Sidebar } from "./Sidebar";
import { BreadcrumbBar, TopTabsBar } from "./TopBars";
import { UrlBar } from "./UrlBar";
import { AuthTab } from "./tabs/AuthTab";
import { BodyTab } from "./tabs/BodyTab";
import { DocsTab } from "./tabs/DocsTab";
import { HeadersTab } from "./tabs/HeadersTab";
import { ParamsTab } from "./tabs/ParamsTab";
import { ScriptsTab } from "./tabs/ScriptsTab";
import { SettingsTab } from "./tabs/SettingsTab";
import type { ResponseShape, State } from "./types";

export default function PostmanEndpoints() {
  const [state, setState] = useState<State>(initialState);
  const [tab, setTab] = useState("Params");
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<ResponseShape | null>(null);
  const [respTab, setRespTab] = useState("Pretty");
  const [showToken, setShowToken] = useState(false);
  const [hideAuto, setHideAuto] = useState(false);
  const [scriptSub, setScriptSub] = useState("Pre-request");
  const [bodyKind, setBodyKind] = useState("none");
  const [rawLang, setRawLang] = useState("JSON");
  const [saved, setSaved] = useState(false);

  const upd = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));

  const activeParams = state.params.filter((p) => p.enabled && p.key).length;
  const activeHeaders = state.headers.filter((h) => h.enabled && h.key).length;
  const hasAuth = state.authKind !== "none";
  const hasBody = bodyKind !== "none";
  const hasScripts =
    state.preScript.trim().length > 60 || state.postScript.trim().length > 60;

  const handleSend = () => {
    setSending(true);
    setResponse(null);
    setTimeout(() => {
      const sample = {
        ok: true,
        endpoint: state.url,
        data: [
          { id: "ep_1", name: "Billing — Invoices", method: "GET", url: "https://api.acme.io/v2/invoices", status: "drifted", drift_count: 3 },
          { id: "ep_2", name: "Auth — Session", method: "POST", url: "https://api.acme.io/v2/auth/session", status: "healthy", drift_count: 0 },
          { id: "ep_3", name: "Catalog — Products", method: "GET", url: "https://api.acme.io/v2/products", status: "healthy", drift_count: 0 },
        ],
        meta: { total: 3, page: 1, per_page: 20, generated_at: new Date().toISOString(), schema_version: "v1.4.2" },
      };
      setResponse({
        status: 200,
        time: 80 + Math.floor(Math.random() * 200),
        size: "1.20 KB",
        body: JSON.stringify(sample, null, 2),
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-request-id": "req_" + Math.random().toString(36).slice(2, 10),
          "cache-control": "no-store, no-cache",
          "x-response-time": "127ms",
          "x-schema-version": "v1.4.2",
        },
      });
      setSending(false);
    }, 800);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const TABS: { label: string; badge: ReactNode }[] = [
    { label: "Docs", badge: null },
    { label: "Params", badge: activeParams ? <CountPill>{activeParams}</CountPill> : null },
    { label: "Authorization", badge: hasAuth ? <Dot color="#1a9c52" /> : null },
    { label: "Headers", badge: <CountPill>{activeHeaders + (hideAuto ? 0 : AUTO_HEADERS.length)}</CountPill> },
    { label: "Body", badge: hasBody ? <Dot color="#d97706" /> : null },
    { label: "Scripts", badge: hasScripts ? <Dot color="#7c3aed" /> : null },
    { label: "Settings", badge: null },
  ];

  return (
    <div style={{ background: "#1a1a1a", minHeight: "100vh", color: "#e8e8e8", fontFamily: "'Inter', -apple-system, sans-serif", display: "flex", flexDirection: "column" }}>
      <TopTabsBar />
      <BreadcrumbBar name={state.name} setName={(n) => upd({ name: n })} saved={saved} onSave={handleSave} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <UrlBar
            method={state.method}
            url={state.url}
            setMethod={(m) => upd({ method: m })}
            setUrl={(u) => upd({ url: u })}
            sending={sending}
            onSend={handleSend}
          />

          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 16px", gap: 2, overflowX: "auto" }}>
            {TABS.map(({ label, badge }) => (
              <button key={label} onClick={() => setTab(label)} style={{ position: "relative", display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 38, background: "transparent", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, color: tab === label ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)", whiteSpace: "nowrap", transition: "color 0.15s" }}>
                {label}
                {badge}
                {tab === label && <span style={{ position: "absolute", bottom: 0, left: 6, right: 6, height: 2, background: "#ff6b35", borderRadius: "2px 2px 0 0" }} />}
              </button>
            ))}
            <div style={{ marginLeft: "auto", paddingLeft: 10 }}>
              <button style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Cookies</button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "14px 16px" }}>
            {tab === "Params" && <ParamsTab params={state.params} setParams={(p) => upd({ params: p })} />}
            {tab === "Authorization" && (
              <AuthTab
                authKind={state.authKind}
                setAuthKind={(k) => upd({ authKind: k })}
                bearer={state.bearer}
                setBearer={(b) => upd({ bearer: b })}
                showToken={showToken}
                setShowToken={setShowToken}
              />
            )}
            {tab === "Headers" && (
              <HeadersTab
                headers={state.headers}
                setHeaders={(h) => upd({ headers: h })}
                hideAuto={hideAuto}
                setHideAuto={setHideAuto}
              />
            )}
            {tab === "Body" && (
              <BodyTab
                bodyKind={bodyKind}
                setBodyKind={setBodyKind}
                rawLang={rawLang}
                setRawLang={setRawLang}
                body={state.body}
                setBody={(b) => upd({ body: b })}
              />
            )}
            {tab === "Scripts" && (
              <ScriptsTab
                scriptSub={scriptSub}
                setScriptSub={setScriptSub}
                preScript={state.preScript}
                postScript={state.postScript}
                setPre={(v) => upd({ preScript: v })}
                setPost={(v) => upd({ postScript: v })}
              />
            )}
            {tab === "Settings" && (
              <SettingsTab settings={state.settings} setSettings={(s) => upd({ settings: s })} />
            )}
            {tab === "Docs" && <DocsTab name={state.name} />}
          </div>

          {(sending || response) && (
            <ResponsePanel
              sending={sending}
              response={response}
              respTab={respTab}
              setRespTab={setRespTab}
              onClose={() => setResponse(null)}
            />
          )}

          {!sending && !response && (
            <div style={{ padding: "50px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"><path d="M22 2L11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              {[["Send + Get a successful response"], ["Send + Visualize response"], ["Send + Write tests"]].map(([text]) => (
                <div key={text} style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>{text}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        select option { background: #242424; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
        textarea::placeholder { color: rgba(255,255,255,0.25) !important; }
        details summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}
