import type { AutoHeader, KV } from "./types";
import { newKV } from "./utils";

export function KVTable({
  rows,
  setRows,
  keyPh = "Key",
  showDesc = true,
  autoRows = null,
  hideAuto = false,
}: {
  rows: KV[];
  setRows: (rows: KV[]) => void;
  keyPh?: string;
  valPh?: string;
  showDesc?: boolean;
  autoRows?: AutoHeader[] | null;
  hideAuto?: boolean;
}) {
  const update = (i: number, patch: Partial<KV>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    if (i === rows.length - 1 && (patch.key || patch.value)) next.push(newKV());
    setRows(next);
  };
  const remove = (i: number) => setRows(rows.filter((_, idx) => idx !== i));

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {autoRows && !hideAuto && (
        <div style={{ marginBottom: 8, border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
          {autoRows.map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1.1fr 1.4fr 28px", borderBottom: i < autoRows.length - 1 ? "0.5px solid rgba(255,255,255,0.04)" : "none", background: "rgba(255,255,255,0.02)", opacity: 0.6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 12, height: 12, border: "1.5px solid #1a9c52", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 7, height: 7, background: "#1a9c52", borderRadius: 1 }} />
                </div>
              </div>
              <div style={{ padding: "7px 10px", fontSize: 11, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 6 }}>
                {r.key}
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", fontSize: 9, color: "rgba(255,255,255,0.4)", cursor: "default" }}>i</span>
              </div>
              <div style={{ padding: "7px 10px", fontSize: 11, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>{r.value}</div>
              <div />
            </div>
          ))}
        </div>
      )}
      <div style={{ border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: showDesc ? "28px 1.2fr 1.4fr 1.2fr 28px" : "28px 1.2fr 1.4fr 28px", background: "rgba(255,255,255,0.03)", borderBottom: "0.5px solid rgba(255,255,255,0.07)", padding: "5px 0" }}>
          <div />
          <div style={{ padding: "0 10px", fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{keyPh}</div>
          <div style={{ padding: "0 10px", fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Value</div>
          {showDesc && <div style={{ padding: "0 10px", fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Description</div>}
          <div />
        </div>
        {rows.map((r, i) => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: showDesc ? "28px 1.2fr 1.4fr 1.2fr 28px" : "28px 1.2fr 1.4fr 28px", borderBottom: i < rows.length - 1 ? "0.5px solid rgba(255,255,255,0.04)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", transition: "background 0.1s" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div onClick={() => update(i, { enabled: !r.enabled })} style={{ width: 12, height: 12, border: `1.5px solid ${r.enabled ? "#1a9c52" : "rgba(255,255,255,0.2)"}`, borderRadius: 2, background: r.enabled ? "#1a9c52" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}>
                {r.enabled && (
                  <svg width="7" height="7" viewBox="0 0 10 10"><path d="M1.5 5l3 3 4-6" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
                )}
              </div>
            </div>
            <input value={r.key} onChange={(e) => update(i, { key: e.target.value })} placeholder={keyPh} style={{ background: "transparent", border: "none", outline: "none", padding: "7px 10px", fontSize: 12, color: r.key ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)", fontFamily: "inherit", width: "100%" }} />
            <input value={r.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="Value" style={{ background: "transparent", border: "none", outline: "none", padding: "7px 10px", fontSize: 12, color: r.value ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontFamily: "inherit", width: "100%" }} />
            {showDesc && (
              <input value={r.desc || ""} onChange={(e) => update(i, { desc: e.target.value })} placeholder="Description" style={{ background: "transparent", border: "none", outline: "none", padding: "7px 10px", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "inherit", width: "100%" }} />
            )}
            <button onClick={() => remove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <button onClick={() => setRows([newKV()])} style={{ width: "100%", padding: "12px", background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>+ Add row</button>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
        <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.07em" }}>Bulk Edit</button>
      </div>
    </div>
  );
}
