import { useEffect, useRef, useState } from "react";
import { METHOD_COLORS, METHODS } from "./constants";

export function UrlBar({
  method,
  url,
  setMethod,
  setUrl,
  sending,
  onSend,
}: {
  method: string;
  url: string;
  setMethod: (m: string) => void;
  setUrl: (u: string) => void;
  sending: boolean;
  onSend: () => void;
}) {
  const [methodOpen, setMethodOpen] = useState(false);
  const methodRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (methodRef.current && !methodRef.current.contains(e.target as Node)) setMethodOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const mc = METHOD_COLORS[method] || METHOD_COLORS.GET;

  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, overflow: "hidden", transition: "border-color 0.2s" }}>
        <div ref={methodRef} style={{ position: "relative" }}>
          <button onClick={() => setMethodOpen(!methodOpen)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 42, background: "transparent", border: "none", borderRight: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: mc.bg, minWidth: 96 }}>
            {method}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {methodOpen && (
            <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, background: "#242424", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, overflow: "hidden", minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", marginTop: 4 }}>
              {METHODS.map((m) => {
                const c = METHOD_COLORS[m];
                return (
                  <div key={m} onClick={() => { setMethod(m); setMethodOpen(false); }} style={{ padding: "8px 14px", cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.06em", color: c.bg, background: method === m ? "rgba(255,255,255,0.07)" : "transparent", transition: "background 0.1s" }} onMouseEnter={(e) => { if (method !== m) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }} onMouseLeave={(e) => { if (method !== m) e.currentTarget.style.background = "transparent"; }}>{m}</div>
                );
              })}
              <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)", padding: 6 }}>
                <input placeholder="Type a new method" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 4, padding: "5px 8px", fontSize: 11, color: "rgba(255,255,255,0.6)", outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
              </div>
            </div>
          )}
        </div>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL or paste text" style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0 14px", fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "'JetBrains Mono', monospace" }} />
        <div style={{ display: "flex", alignItems: "stretch" }}>
          <button onClick={onSend} disabled={sending} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 22px", background: "#2563eb", border: "none", cursor: sending ? "wait" : "pointer", fontSize: 13, fontWeight: 600, color: "#fff", transition: "all 0.15s", opacity: sending ? 0.7 : 1 }}>
            {sending ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            )}
            {sending ? "Sending" : "Send"}
          </button>
          <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
          <button style={{ display: "flex", alignItems: "center", padding: "0 10px", background: "#2563eb", border: "none", cursor: "pointer", color: "#fff" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
