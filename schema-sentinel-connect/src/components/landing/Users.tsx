const users = [
  { t: "Frontend Devs", d: "Stop debugging undefined errors caused by backend refactors you weren't told about." },
  { t: "Solo Founders", d: "Protect your MVP from third-party API changes while you sleep — without an on-call." },
  { t: "Product Managers", d: "Keep dashboards accurate during active backend migrations and feature rollouts." },
  { t: "Data Teams", d: "Validate that downstream consumers aren't silently broken by new data models." },
];

export function Users() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <div className="text-mono mb-4 text-[11px] uppercase tracking-widest text-brand">
            Who it's for
          </div>
          <h2 className="text-balance text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Built for reliability-first teams.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {users.map((u) => (
            <div
              key={u.t}
              className="group relative overflow-hidden rounded-xl border border-border bg-card/40 p-6 transition-all hover:border-brand/30 hover:bg-card"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <p className="mb-2 text-sm font-medium text-foreground">{u.t}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{u.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
