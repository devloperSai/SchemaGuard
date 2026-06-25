export function GapSection() {
  return (
    <section id="product" className="border-y border-border bg-card/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <div className="text-mono mb-4 text-[11px] uppercase tracking-widest text-brand">
              The Monitoring Gap
            </div>
            <h2 className="text-balance text-3xl font-medium leading-tight tracking-tight text-foreground md:text-4xl">
              Why <span className="text-mono text-brand">200 OK</span> is no longer enough.
            </h2>
            <p className="mt-6 max-w-[58ch] text-pretty text-muted-foreground">
              Standard monitors watch the envelope — they check if the server responded and how fast.
              If the response <em>shape</em> changes, your frontend fails silently while your status
              page glows green.
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-1 grid size-4 shrink-0 place-items-center rounded-full border border-rose-500/50">
                  <div className="size-1.5 rounded-full bg-rose-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground">Uptime monitors</span> report 200 OK even if every
                  field in the JSON has been renamed.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 grid size-4 shrink-0 place-items-center rounded-full border border-brand/50">
                  <div className="size-1.5 rounded-full bg-brand" />
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground">SchemaGuard</span> validates the inner payload
                  against your UI's specific contract — per field, per type.
                </p>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatusCard
              label="Legacy Monitor"
              status="Healthy"
              detail="HTTP 200 · 42ms"
              color="brand"
              progress={100}
            />
            <StatusCard
              label="SchemaGuard"
              status="Drifted"
              detail="Field mismatch detected"
              color="danger"
              progress={66}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusCard({
  label,
  status,
  detail,
  color,
  progress,
}: {
  label: string;
  status: string;
  detail: string;
  color: "brand" | "danger";
  progress: number;
}) {
  const isBrand = color === "brand";
  return (
    <div
      className={`rounded-xl bg-card p-6 ring-1 ${
        isBrand ? "ring-border" : "ring-rose-500/20"
      }`}
    >
      <span className="text-mono mb-4 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full ${isBrand ? "bg-brand" : "bg-rose-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className={`text-mono mt-4 text-sm ${isBrand ? "text-brand" : "text-rose-500"}`}>
        Status: {status}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
