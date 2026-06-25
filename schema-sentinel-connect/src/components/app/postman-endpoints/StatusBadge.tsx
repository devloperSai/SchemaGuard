export function StatusBadge({ status }: { status: number }) {
  const isOk = status < 300;
  const is3xx = status >= 300 && status < 400;
  const color = isOk ? "#1a9c52" : is3xx ? "#d97706" : "#dc2626";
  const label = isOk ? "OK" : is3xx ? "Redirect" : "Error";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 4, background: `${color}22`, border: `1px solid ${color}44`, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color, letterSpacing: "0.05em" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {status} {label}
    </span>
  );
}
