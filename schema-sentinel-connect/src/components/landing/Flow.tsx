import { Globe, Server, ShieldAlert, MonitorSmartphone, Bell } from "lucide-react";

const steps = [
  { icon: MonitorSmartphone, title: "Dashboard", sub: "Frontend request" },
  { icon: Server, title: "SchemaGuard Proxy", sub: "Intercept & forward" },
  { icon: Globe, title: "Real API", sub: "Origin response" },
  { icon: ShieldAlert, title: "Diff Engine", sub: "Compare baseline" },
  { icon: Bell, title: "Decision", sub: "Pass / freeze / alert" },
];

export function Flow() {
  return (
    <section className="border-y border-border bg-card/30 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <div className="text-mono mb-4 text-[11px] uppercase tracking-widest text-brand">
            Request lifecycle
          </div>
          <h2 className="text-balance text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Every API call, inspected in flight.
          </h2>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-brand/40 to-transparent md:block"
            aria-hidden
          />
          <div className="relative grid gap-4 md:grid-cols-5">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="relative flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-background px-2">
                  <span className="text-mono text-[10px] tracking-widest text-muted-foreground">
                    0{i + 1}
                  </span>
                </div>
                <div className="grid size-10 place-items-center rounded-lg bg-secondary text-brand">
                  <s.icon className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{s.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
