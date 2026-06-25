export function CodeEditor({
  value,
  onChange,
  lang = "javascript",
  minH = 200,
}: {
  value: string;
  onChange: (v: string) => void;
  lang?: string;
  minH?: number;
}) {
  const lineCount = value.split("\n").length;
  return (
    <div style={{ border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 12px", borderBottom: "0.5px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace" }}>{lang}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{lineCount} lines</span>
      </div>
      <div style={{ display: "flex" }}>
        <pre style={{ margin: 0, padding: "10px 8px", background: "rgba(255,255,255,0.02)", borderRight: "0.5px solid rgba(255,255,255,0.06)", fontSize: 11, lineHeight: "20px", color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace", userSelect: "none", minWidth: 36, textAlign: "right" }}>
          {Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}
        </pre>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "10px 12px", fontSize: 12, lineHeight: "20px", color: "rgba(255,255,255,0.8)", fontFamily: "'JetBrains Mono', monospace", resize: "none", minHeight: minH }} rows={Math.max(8, lineCount)} />
      </div>
    </div>
  );
}
