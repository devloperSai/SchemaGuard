import { LabeledInput } from "../primitives";

export function AuthTab({
  authKind,
  setAuthKind,
  bearer,
  setBearer,
  showToken,
  setShowToken,
}: {
  authKind: string;
  setAuthKind: (k: string) => void;
  bearer: string;
  setBearer: (v: string) => void;
  showToken: boolean;
  setShowToken: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
      <div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Auth Type</div>
        <select value={authKind} onChange={(e) => setAuthKind(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 5, padding: "8px 10px", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", outline: "none" }}>
          {["none", "bearer", "basic", "apiKey", "oauth2"].map((k) => (
            <option key={k} value={k} style={{ background: "#242424" }}>
              {k === "none" ? "No Auth" : k === "bearer" ? "Bearer Token" : k === "basic" ? "Basic Auth" : k === "apiKey" ? "API Key" : "OAuth 2.0"}
            </option>
          ))}
        </select>
        <div style={{ marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          {authKind === "none" && "No authentication credentials will be sent."}
          {authKind === "bearer" && "The authorization header will be automatically generated. Learn more about Bearer Token authorization."}
          {authKind === "basic" && "Username & password are base64-encoded in the Authorization header."}
          {authKind === "apiKey" && "API key sent as a header or query parameter on each request."}
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 16 }}>
        {authKind === "none" && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "20px 0" }}>No authentication selected.</div>}
        {authKind === "bearer" && (
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Token</div>
            <div style={{ display: "flex", border: `1.5px solid ${!bearer ? "#d97706" : "rgba(255,255,255,0.12)"}`, borderRadius: 5, overflow: "hidden", background: "rgba(255,255,255,0.04)", transition: "border-color 0.2s" }}>
              <input type={showToken ? "text" : "password"} value={bearer} onChange={(e) => setBearer(e.target.value)} placeholder="{{API_TOKEN}}" style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "9px 12px", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "'JetBrains Mono', monospace" }} />
              <button onClick={() => setShowToken(!showToken)} style={{ padding: "0 10px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", borderLeft: "0.5px solid rgba(255,255,255,0.08)" }}>
                {showToken ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
              {!bearer && (
                <div style={{ display: "flex", alignItems: "center", padding: "0 8px", color: "#d97706" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
              )}
            </div>
            {!bearer && <div style={{ marginTop: 6, fontSize: 11, color: "#d97706" }}>⚠ Token is empty — add a token or use No Auth.</div>}
          </div>
        )}
        {authKind === "basic" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <LabeledInput label="Username" placeholder="Username" />
            <LabeledInput label="Password" type="password" placeholder="Password" />
          </div>
        )}
        {authKind === "apiKey" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 12 }}>
            <LabeledInput label="Key" placeholder="X-Api-Key" />
            <LabeledInput label="Value" placeholder="{{API_KEY}}" />
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Add to</div>
              <select style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 5, padding: "8px 10px", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", outline: "none" }}>
                <option style={{ background: "#242424" }}>Header</option>
                <option style={{ background: "#242424" }}>Query Params</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
