import { AUTO_HEADERS } from "../constants";
import { KVTable } from "../KVTable";
import type { KV } from "../types";

export function HeadersTab({
  headers,
  setHeaders,
  hideAuto,
  setHideAuto,
}: {
  headers: KV[];
  setHeaders: (h: KV[]) => void;
  hideAuto: boolean;
  setHideAuto: (v: boolean) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Headers</span>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
          <input type="checkbox" checked={hideAuto} onChange={(e) => setHideAuto(e.target.checked)} style={{ accentColor: "#1a9c52" }} />
          Hide auto-generated headers
        </label>
      </div>
      <KVTable rows={headers} setRows={setHeaders} keyPh="Header" autoRows={AUTO_HEADERS} hideAuto={hideAuto} />
    </div>
  );
}
