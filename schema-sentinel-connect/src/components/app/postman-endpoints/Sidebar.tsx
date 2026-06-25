import { useState } from "react";
import { METHOD_COLORS } from "./constants";
import { SideBtn } from "./primitives";
import type { Col } from "./types";

export function Sidebar() {
  return (
    <div style={{ width: 240, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", background: "#161616", flexShrink: 0, overflowY: "auto" }}>
      <div style={{ padding: "10px 8px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: 4 }}>Collections</span>
        <div style={{ display: "flex", gap: 2 }}>
          <SideBtn icon="+" title="New" />
          <SideBtn icon="⋯" title="More" />
        </div>
      </div>
      <div style={{ padding: "4px 6px", position: "relative" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input placeholder="Search" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "5px 8px 5px 28px", fontSize: 11, color: "rgba(255,255,255,0.7)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
      </div>
      <ColTree />
      <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "6px 0" }}>
        {[{ label: "Environments" }, { label: "Specs" }, { label: "Flows" }].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 12 }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "6px 10px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Connect Git</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Console</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Terminal</span>
      </div>
    </div>
  );
}

function ColTree() {
  const [open, setOpen] = useState<Record<string, boolean>>({ sg: true, "SLA Testing": false, SMIV: false });
  const cols: Col[] = [
    {
      id: "sg", name: "SchemaGuard",
      endpoints: [
        { name: "Create endpoint", method: "POST", active: false },
        { name: "Get all endpoints", method: "GET", active: true },
        { name: "Get drift logs", method: "GET", active: false },
        { name: "Hit proxy for an endpoint", method: "GET", active: false },
        { name: "New Request", method: "GET", active: false },
      ],
    },
    { id: "SLA Testing", name: "SLA Testing", endpoints: [] },
    { id: "SMIV", name: "SMIV_APIs", endpoints: [] },
  ];
  return (
    <div style={{ padding: "0 6px" }}>
      {cols.map((col) => (
        <div key={col.id}>
          <div onClick={() => setOpen((o) => ({ ...o, [col.id]: !o[col.id] }))} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500 }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: "transform 0.15s", transform: open[col.id] ? "rotate(90deg)" : "none" }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open[col.id] ? "#d97706" : "rgba(255,255,255,0.4)"} strokeWidth="1.5">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.name}</span>
          </div>
          {open[col.id] && col.endpoints.map((ep) => {
            const c = METHOD_COLORS[ep.method] || METHOD_COLORS.GET;
            return (
              <div key={ep.name} style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 24, paddingRight: 8, height: 28, borderRadius: 4, cursor: "pointer", background: ep.active ? "rgba(255,107,53,0.12)" : "transparent", color: ep.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)", fontSize: 12 }} onMouseEnter={(e) => { if (!ep.active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }} onMouseLeave={(e) => { if (!ep.active) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: c.bg, minWidth: 30 }}>{ep.method}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.name}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
