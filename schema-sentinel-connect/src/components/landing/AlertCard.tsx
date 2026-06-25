import { AlertTriangle, ArrowRight } from "lucide-react";

export function AlertCard() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div>
          <div className="text-mono mb-4 text-[11px] uppercase tracking-widest text-brand">
            Developer alerts
          </div>
          <h2 className="text-balance text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Field-level diffs. Zero noise.
          </h2>
          <p className="mt-6 max-w-[52ch] text-muted-foreground">
            Get an alert the moment something the dashboard actually consumes changes. Acknowledge,
            remap, and resume — the UI never went down.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Severity-classified diffs (informational vs breaking)",
              "Only fires for fields your UI actually uses",
              "One-click remap to restore the live data path",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-muted-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 bg-rose-500/10 opacity-50 blur-3xl" aria-hidden />
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
            <div className="flex items-center gap-3 border-b border-border bg-rose-500/5 px-5 py-3">
              <div className="grid size-7 place-items-center rounded-md bg-rose-500/15 text-rose-400">
                <AlertTriangle className="size-3.5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Schema drift detected</div>
                <div className="text-mono text-[11px] text-muted-foreground">
                  /api/dashboard/stats · 10:32 AM
                </div>
              </div>
              <span className="text-mono ml-auto rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-400">
                Breaking
              </span>
            </div>

            <div className="space-y-1 p-5 text-mono text-xs">
              <DiffLine sign="-" label="revenue" type="number" />
              <DiffLine sign="-" label="region" type="string" />
              <DiffLine sign="+" label="total_revenue" type="number" />
              <DiffLine sign="+" label="zone" type="string" />
            </div>

            <div className="border-t border-border bg-secondary/30 px-5 py-3 text-xs text-muted-foreground">
              Dashboard protected — serving last good snapshot from{" "}
              <span className="text-foreground">10:28 AM</span>
            </div>

            <div className="flex gap-2 border-t border-border p-4">
              <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground transition-all hover:brightness-110">
                Acknowledge & Remap
                <ArrowRight className="size-3.5" />
              </button>
              <button className="rounded-md bg-secondary px-3 py-2 text-xs font-medium text-foreground ring-1 ring-border transition-colors hover:bg-accent">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DiffLine({ sign, label, type }: { sign: "+" | "-"; label: string; type: string }) {
  const isAdd = sign === "+";
  return (
    <div
      className={`flex items-center gap-3 rounded px-2 py-1 ${
        isAdd ? "bg-brand/10 text-brand" : "bg-rose-500/10 text-rose-400"
      }`}
    >
      <span className="w-3 select-none">{sign}</span>
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground/60">({type})</span>
      <span
        className={`text-mono ml-auto text-[9px] uppercase tracking-widest ${
          isAdd ? "text-brand/70" : "text-rose-400/70"
        }`}
      >
        {isAdd ? "Added" : "Removed"}
      </span>
    </div>
  );
}
