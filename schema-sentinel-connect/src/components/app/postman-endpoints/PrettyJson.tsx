/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

export function PrettyJson({ json }: { json: string }) {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    return <pre style={{ margin: 0, padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{json}</pre>;
  }
  return (
    <div style={{ padding: "10px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "20px" }}>
      <JsonNode value={parsed} depth={0} isLast />
    </div>
  );
}

function JsonNode({ value, keyName, depth, isLast }: { value: any; keyName?: string | number; depth: number; isLast: boolean }) {
  const [open, setOpen] = useState(depth < 2);
  const pad = depth * 14;
  const rk = keyName !== undefined ? (
    <>
      <span style={{ color: "#7dd3fc" }}>"{keyName}"</span>
      <span style={{ color: "rgba(255,255,255,0.4)" }}>: </span>
    </>
  ) : null;
  const comma = !isLast ? <span style={{ color: "rgba(255,255,255,0.4)" }}>,</span> : null;

  if (value === null)
    return (
      <div style={{ paddingLeft: pad }}>
        {rk}
        <span style={{ color: "#fca5a5" }}>null</span>
        {comma}
      </div>
    );
  if (Array.isArray(value)) {
    return (
      <>
        <div style={{ paddingLeft: pad, cursor: "pointer" }} onClick={() => setOpen((v) => !v)}>
          <span style={{ color: "rgba(255,255,255,0.3)", marginRight: 4, fontSize: 10 }}>{open ? "▾" : "▸"}</span>
          {rk}
          <span style={{ color: "rgba(255,255,255,0.5)" }}>[</span>
          {!open && (
            <>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}> {value.length} items </span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>]</span>
              {comma}
            </>
          )}
        </div>
        {open && value.map((v: any, i: number) => (
          <JsonNode key={i} value={v} keyName={i} depth={depth + 1} isLast={i === value.length - 1} />
        ))}
        {open && (
          <div style={{ paddingLeft: pad }}>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>]</span>
            {comma}
          </div>
        )}
      </>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    return (
      <>
        <div style={{ paddingLeft: pad, cursor: "pointer" }} onClick={() => setOpen((v) => !v)}>
          <span style={{ color: "rgba(255,255,255,0.3)", marginRight: 4, fontSize: 10 }}>{open ? "▾" : "▸"}</span>
          {rk}
          <span style={{ color: "rgba(255,255,255,0.5)" }}>{"{"}</span>
          {!open && (
            <>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}> {entries.length} props </span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{"}"}</span>
              {comma}
            </>
          )}
        </div>
        {open && entries.map(([k, v], i) => (
          <JsonNode key={k} value={v} keyName={k} depth={depth + 1} isLast={i === entries.length - 1} />
        ))}
        {open && (
          <div style={{ paddingLeft: pad }}>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{"}"}</span>
            {comma}
          </div>
        )}
      </>
    );
  }
  const clr = typeof value === "string" ? "#86efac" : typeof value === "number" ? "#fcd34d" : typeof value === "boolean" ? "#c4b5fd" : "rgba(255,255,255,0.7)";
  const disp = typeof value === "string" ? `"${value}"` : String(value);
  return (
    <div style={{ paddingLeft: pad }}>
      {rk}
      <span style={{ color: clr }}>{disp}</span>
      {comma}
    </div>
  );
}
