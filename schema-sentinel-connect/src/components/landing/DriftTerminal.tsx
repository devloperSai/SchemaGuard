import { useEffect, useState } from "react";

type Line =
  | { kind: "log"; t: string; text: React.ReactNode }
  | { kind: "alert"; t: string; text: React.ReactNode }
  | { kind: "diff"; sign: "-" | "+"; text: string }
  | { kind: "action"; t: string; text: React.ReactNode }
  | { kind: "spacer" };

const SCRIPT: Line[] = [
  { kind: "log", t: "09:42:11", text: <>Checking <span className="text-brand">api.acme.com/v1/billing</span>…</> },
  { kind: "alert", t: "09:42:12", text: <span className="font-semibold text-rose-400">[DRIFT DETECTED] Severity: Critical</span> },
  { kind: "spacer" },
  { kind: "diff", sign: "-", text: `"invoice_id": string` },
  { kind: "diff", sign: "+", text: `"id": uuid` },
  { kind: "diff", sign: "-", text: `"amount": number` },
  { kind: "diff", sign: "+", text: `"total_due": number` },
  { kind: "spacer" },
  {
    kind: "action",
    t: "09:42:12",
    text: (
      <span className="text-brand">
        [ACTION] Fallback initiated. Serving snapshot:{" "}
        <span className="underline decoration-brand/40 underline-offset-2">snap_2024_05_14.json</span>
      </span>
    ),
  },
];

export function DriftTerminal() {
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    if (visible >= SCRIPT.length) {
      const reset = setTimeout(() => setVisible(1), 4500);
      return () => clearTimeout(reset);
    }
    const t = setTimeout(() => setVisible((v) => v + 1), 380);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-card ring-1 ring-border shadow-elevated">
      <div className="flex h-10 items-center gap-2 border-b border-border/70 bg-secondary/40 px-4">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-white/10" />
          <div className="size-2.5 rounded-full bg-white/10" />
          <div className="size-2.5 rounded-full bg-white/10" />
        </div>
        <span className="ml-3 text-mono text-[11px] text-muted-foreground">
          proxy_logs/drift_detector.log
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="size-1.5 animate-pulse-soft rounded-full bg-brand" />
          live
        </span>
      </div>

      <div className="p-6 text-mono text-xs leading-relaxed min-h-[280px]">
        {SCRIPT.slice(0, visible).map((line, i) => {
          if (line.kind === "spacer") return <div key={i} className="h-3" />;
          if (line.kind === "diff") {
            const isAdd = line.sign === "+";
            return (
              <div
                key={i}
                className={`-mx-2 my-px flex animate-fade-up items-center gap-3 rounded px-2 py-0.5 ${
                  isAdd ? "bg-brand/10 text-brand" : "bg-rose-500/10 text-rose-400"
                }`}
              >
                <span className="w-4 select-none">{line.sign}</span>
                <span>{line.text}</span>
              </div>
            );
          }
          return (
            <div key={i} className="flex animate-fade-up gap-4">
              <span className="shrink-0 text-muted-foreground/60">{line.t}</span>
              <span className={line.kind === "alert" ? "" : "text-muted-foreground"}>{line.text}</span>
            </div>
          );
        })}
        <span className="ml-1 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-brand/70 align-middle" />
      </div>
    </div>
  );
}
