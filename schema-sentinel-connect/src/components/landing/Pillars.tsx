import { Activity, GitCompareArrows, ShieldCheck } from "lucide-react";

const items = [
  {
    n: "01",
    icon: Activity,
    title: "Schema Watcher",
    body: "Continuously fingerprints your API payloads. Learns nesting, types, and constraints without manual OpenAPI definitions.",
  },
  {
    n: "02",
    icon: GitCompareArrows,
    title: "Intelligent Diff Engine",
    body: "Classifies every change as additive (safe) or destructive (breaking). No more alert fatigue from harmless additions.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Auto Fallback",
    body: "Serves cached, structurally-correct data the instant drift is detected. Users see yesterday's numbers — never a crash.",
  },
];

export function Pillars() {
  return (
    <section id="how" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-2xl">
          <div className="text-mono mb-4 text-[11px] uppercase tracking-widest text-brand">
            Three pillars
          </div>
          <h2 className="text-balance text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            One proxy. Three layers of defense.
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl bg-border md:grid-cols-3">
          {items.map(({ n, icon: Icon, title, body }) => (
            <div
              key={n}
              className="group relative bg-card/60 p-8 transition-all hover:bg-card"
            >
              <div className="text-mono mb-6 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground/70">
                <span>{n}</span>
                <div className="grid size-9 place-items-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                  <Icon className="size-4" />
                </div>
              </div>
              <h3 className="mb-3 text-xl font-medium text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              <div className="absolute inset-x-8 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-brand to-transparent transition-transform duration-500 group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
