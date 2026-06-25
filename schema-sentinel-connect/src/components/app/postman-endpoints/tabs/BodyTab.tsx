import { CodeEditor } from "../CodeEditor";
import { KVTable } from "../KVTable";
import { newKV } from "../utils";
import type { BodyState } from "../types";

export function BodyTab({
  bodyKind,
  setBodyKind,
  rawLang,
  setRawLang,
  body,
  setBody,
}: {
  bodyKind: string;
  setBodyKind: (k: string) => void;
  rawLang: string;
  setRawLang: (l: string) => void;
  body: BodyState;
  setBody: (b: BodyState) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 6, border: "0.5px solid rgba(255,255,255,0.07)" }}>
        {["none", "form-data", "x-www-form-urlencoded", "raw", "binary", "GraphQL"].map((k) => (
          <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: bodyKind === k ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)", cursor: "pointer" }} onClick={() => setBodyKind(k)}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${bodyKind === k ? "#ff6b35" : "rgba(255,255,255,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
              {bodyKind === k && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff6b35" }} />}
            </div>
            <span>{k}</span>
          </label>
        ))}
        {bodyKind === "raw" && (
          <select value={rawLang} onChange={(e) => setRawLang(e.target.value)} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "3px 8px", fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "inherit", outline: "none" }}>
            {["JSON", "Text", "HTML", "XML", "JavaScript"].map((l) => (<option key={l} style={{ background: "#242424" }}>{l}</option>))}
          </select>
        )}
      </div>
      {bodyKind === "none" && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>This request does not have a body</div>}
      {bodyKind === "raw" && <CodeEditor value={body.raw} onChange={(v) => setBody({ ...body, raw: v })} lang={rawLang} />}
      {(bodyKind === "form-data" || bodyKind === "x-www-form-urlencoded") && <KVTable rows={[newKV()]} setRows={() => {}} keyPh="Field" />}
      {bodyKind === "binary" && (
        <div style={{ padding: "40px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          Drop a file or <span style={{ color: "#2563eb", cursor: "pointer" }}>choose one</span> to upload as binary body
        </div>
      )}
      {bodyKind === "GraphQL" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Query</div>
            <CodeEditor value={"query {\n  endpoints(limit: 10) {\n    id\n    name\n    status\n    drift_count\n  }\n}"} onChange={() => {}} lang="GraphQL" minH={120} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Variables</div>
            <CodeEditor value={"{\n  \n}"} onChange={() => {}} lang="JSON" minH={120} />
          </div>
        </div>
      )}
    </div>
  );
}
