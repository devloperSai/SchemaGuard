import type { ReactNode } from "react";

export function SideBtn({ icon, title }: { icon: string; title: string }) {
  return (
    <button title={title} style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 16, borderRadius: 4 }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")} onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
      {icon}
    </button>
  );
}

export function Dot({ color = "#1a9c52" }: { color?: string }) {
  return <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: color, marginLeft: 3 }} />;
}

export function CountPill({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 18, height: 16, padding: "0 4px", borderRadius: 8, background: "rgba(255,255,255,0.1)", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", fontFamily: "monospace", marginLeft: 4 }}>
      {children}
    </span>
  );
}

export function LabeledInput({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <input type={type} placeholder={placeholder} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 5, padding: "8px 10px", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", outline: "none" }} />
    </div>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} style={{ width: 36, height: 20, borderRadius: 10, background: checked ? "#1a9c52" : "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
      <span style={{ position: "absolute", top: 2, left: checked ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </button>
  );
}

export function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 6, border: "0.5px solid rgba(255,255,255,0.07)" }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{label}</span>
      {children}
    </div>
  );
}
