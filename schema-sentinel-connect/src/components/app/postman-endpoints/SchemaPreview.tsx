/* eslint-disable @typescript-eslint/no-explicit-any */
export function SchemaPreview({ body }: { body: string }) {
  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch {
    return <div style={{ padding: "8px 0", fontSize: 11, color: "#dc2626" }}>Invalid JSON</div>;
  }
  const rows: { path: string; type: string }[] = [];
  const walk = (v: any, path: string) => {
    if (v === null) { rows.push({ path, type: "null" }); return; }
    if (Array.isArray(v)) { rows.push({ path, type: `array[${v.length}]` }); if (v[0]) walk(v[0], `${path}[0]`); return; }
    if (typeof v === "object") { Object.keys(v).forEach((k) => walk(v[k], path ? `${path}.${k}` : k)); return; }
    rows.push({ path, type: typeof v });
  };
  walk(parsed, "");
  return (
    <div style={{ marginTop: 8, maxHeight: 160, overflowY: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", borderBottom: "0.5px solid rgba(255,255,255,0.06)", padding: "3px 0", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        <span>Field</span>
        <span>Type</span>
      </div>
      {rows.slice(0, 12).map((r) => (
        <div key={r.path} style={{ display: "grid", gridTemplateColumns: "1fr 100px", padding: "3px 0", borderBottom: "0.5px solid rgba(255,255,255,0.03)", fontSize: 11 }}>
          <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.65)" }}>{r.path}</span>
          <span style={{ fontFamily: "monospace", color: r.type === "string" ? "#86efac" : r.type.startsWith("number") || r.type === "number" ? "#fcd34d" : r.type === "boolean" ? "#c4b5fd" : "rgba(255,255,255,0.4)" }}>{r.type}</span>
        </div>
      ))}
    </div>
  );
}
