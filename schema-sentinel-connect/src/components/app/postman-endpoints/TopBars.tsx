export function TopTabsBar() {
  return (
    <div style={{ background: "#141414", borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto", display: "flex", alignItems: "center", gap: 0, minHeight: 38 }}>
      <div style={{ display: "flex", alignItems: "stretch", padding: "0 4px", gap: 2, flex: 1, overflowX: "auto" }}>
        {["SchemaGuard", "Get all endpoints"].map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, cursor: "pointer", borderBottom: i === 1 ? "2px solid #ff6b35" : "none", background: i === 1 ? "rgba(255,255,255,0.04)" : "transparent", fontSize: 12, color: i === 1 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)", whiteSpace: "nowrap", flexShrink: 0 }}>
            {i === 0 && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>}
            {i === 1 && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff6b35", display: "inline-block" }} />}
            {label}
            {i === 1 && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 18, height: 38 }}>+</div>
      </div>
    </div>
  );
}

export function BreadcrumbBar({
  name,
  setName,
  saved,
  onSave,
}: {
  name: string;
  setName: (n: string) => void;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "#1a1a1a" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>SchemaGuard</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em", minWidth: 0, flex: 1 }} />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        <button onClick={onSave} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 5, background: saved ? "rgba(26,156,82,0.15)" : "transparent", border: `1px solid ${saved ? "rgba(26,156,82,0.4)" : "rgba(255,255,255,0.12)"}`, color: saved ? "#1a9c52" : "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
          {saved ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
          )}
          {saved ? "Saved!" : "Save"}
        </button>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 5, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
          Share
        </button>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
      </div>
    </div>
  );
}
