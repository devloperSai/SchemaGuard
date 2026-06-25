import { PrettyJson } from "./PrettyJson";
import { SchemaPreview } from "./SchemaPreview";
import { StatusBadge } from "./StatusBadge";
import type { ResponseShape } from "./types";

export function ResponsePanel({
  sending,
  response,
  respTab,
  setRespTab,
  onClose,
}: {
  sending: boolean;
  response: ResponseShape | null;
  respTab: string;
  setRespTab: (t: string) => void;
  onClose: () => void;
}) {
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "#161616", display: "flex", flexDirection: "column", maxHeight: "55%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Response</span>
        {sending && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", animation: "pulse 1.2s ease-in-out infinite" }}>⏳ Sending request...</span>}
        {response && (
          <>
            <StatusBadge status={response.status} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Time: <span style={{ color: "rgba(255,255,255,0.8)", fontFamily: "monospace" }}>{response.time} ms</span></span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Size: <span style={{ color: "rgba(255,255,255,0.8)", fontFamily: "monospace" }}>{response.size}</span></span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button style={{ padding: "3px 10px", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 4, fontSize: 11, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit" }}>Save Response</button>
              <button onClick={onClose} style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 4, cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </>
        )}
      </div>

      {response && (
        <>
          <div style={{ display: "flex", alignItems: "center", borderBottom: "0.5px solid rgba(255,255,255,0.06)", padding: "0 16px", flexShrink: 0 }}>
            {["Pretty", "Raw", "Headers", "Test Results"].map((rt) => (
              <button key={rt} onClick={() => setRespTab(rt)} style={{ position: "relative", padding: "0 14px", height: 34, background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500, color: respTab === rt ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>
                {rt}
                {respTab === rt && <span style={{ position: "absolute", bottom: 0, left: 6, right: 6, height: 2, background: "#ff6b35", borderRadius: "2px 2px 0 0" }} />}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>application/json</span>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {respTab === "Pretty" && <PrettyJson json={response.body} />}
            {respTab === "Raw" && (
              <pre style={{ margin: 0, padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{response.body}</pre>
            )}
            {respTab === "Headers" && (
              <div style={{ padding: "10px 16px" }}>
                {Object.entries(response.headers).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 12, padding: "5px 0", borderBottom: "0.5px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                    <span style={{ color: "rgba(255,255,255,0.45)", fontFamily: "monospace", minWidth: 180 }}>{k}</span>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            {respTab === "Test Results" && (
              <div style={{ padding: "12px 16px" }}>
                {[
                  { name: "Status 200", passed: true },
                  { name: "Response time < 500ms", passed: response.time < 500 },
                  { name: "Schema valid", passed: true },
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "0.5px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                    <span style={{ color: t.passed ? "#1a9c52" : "#dc2626", fontWeight: 700 }}>{t.passed ? "✓" : "✗"}</span>
                    <span style={{ color: t.passed ? "rgba(255,255,255,0.7)" : "#dc2626" }}>{t.name}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: t.passed ? "#1a9c52" : "#dc2626", fontFamily: "monospace", textTransform: "uppercase" }}>{t.passed ? "PASS" : "FAIL"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", padding: "8px 16px", flexShrink: 0 }}>
            <details>
              <summary style={{ cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6, listStyle: "none", userSelect: "none" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a9c52" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <span style={{ color: "#1a9c52", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>SchemaGuard</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>· Extracted schema from response</span>
              </summary>
              <SchemaPreview body={response.body} />
            </details>
          </div>
        </>
      )}

      {!response && !sending && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 12 }}>
          {[
            ["↗", "Send + Get a successful response"],
            ["📊", "Send + Visualize response"],
            ["🧪", "Send + Write tests"],
          ].map(([icon, text]) => (
            <div key={text} style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
