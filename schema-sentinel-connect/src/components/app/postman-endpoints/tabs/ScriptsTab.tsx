import { CodeEditor } from "../CodeEditor";

export function ScriptsTab({
  scriptSub,
  setScriptSub,
  preScript,
  postScript,
  setPre,
  setPost,
}: {
  scriptSub: string;
  setScriptSub: (s: string) => void;
  preScript: string;
  postScript: string;
  setPre: (v: string) => void;
  setPost: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: 3, marginBottom: 14 }}>
        {["Pre-request", "Post-response"].map((s) => (
          <button key={s} onClick={() => setScriptSub(s)} style={{ padding: "5px 14px", borderRadius: 4, background: scriptSub === s ? "rgba(255,255,255,0.1)" : "transparent", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 500, color: scriptSub === s ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)", transition: "all 0.15s" }}>{s}</button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10, lineHeight: 1.5 }}>
        {scriptSub === "Pre-request" ? "JavaScript executed before each poll. Available: pm, req, env" : "Executed after response. Available: pm.test(), res, schema"}
      </div>
      {scriptSub === "Pre-request" ? (
        <CodeEditor value={preScript} onChange={setPre} lang="JavaScript" />
      ) : (
        <CodeEditor value={postScript} onChange={setPost} lang="JavaScript" />
      )}
    </div>
  );
}
