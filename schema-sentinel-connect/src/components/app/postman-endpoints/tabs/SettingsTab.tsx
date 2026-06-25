import { SettingRow, Toggle } from "../primitives";
import type { State } from "../types";

export function SettingsTab({
  settings,
  setSettings,
}: {
  settings: State["settings"];
  setSettings: (s: State["settings"]) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
      <SettingRow label="Follow Redirects">
        <Toggle checked={settings.followRedirects} onChange={(v) => setSettings({ ...settings, followRedirects: v })} />
      </SettingRow>
      <SettingRow label="SSL Verification">
        <Toggle checked={settings.ssl} onChange={(v) => setSettings({ ...settings, ssl: v })} />
      </SettingRow>
      <SettingRow label="Timeout (ms)">
        <input type="number" value={settings.timeout} onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) || 8000 })} style={{ width: 90, background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "5px 8px", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "'JetBrains Mono', monospace", outline: "none" }} />
      </SettingRow>
      <SettingRow label="Polling Interval (min)">
        <input type="number" value={settings.interval} onChange={(e) => setSettings({ ...settings, interval: parseInt(e.target.value) || 5 })} style={{ width: 70, background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "5px 8px", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "'JetBrains Mono', monospace", outline: "none" }} />
      </SettingRow>
      <SettingRow label="Environment">
        <select style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "5px 8px", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", outline: "none" }}>
          <option style={{ background: "#242424" }}>Production</option>
          <option style={{ background: "#242424" }}>Staging</option>
          <option style={{ background: "#242424" }}>Local</option>
        </select>
      </SettingRow>
    </div>
  );
}
