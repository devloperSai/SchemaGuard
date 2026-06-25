import { Shield } from "lucide-react";

export function CTA() {
  return (
    <section className="px-6 py-24">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border bg-card p-12 text-center">
        <div className="grid-bg absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_70%)]" aria-hidden />
        <div className="absolute left-1/2 top-0 -z-0 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="mx-auto mb-8 grid size-16 place-items-center rounded-2xl border border-brand/30 bg-brand/10">
            <Shield className="size-7 text-brand" strokeWidth={2} />
          </div>
          <h2 className="text-balance text-4xl font-semibold tracking-tight text-foreground">
            Ready to freeze the drift?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-muted-foreground">
            Deploy the SchemaGuard proxy in under 5 minutes. SDKs for Node, Go, Python, and Ruby —
            zero changes to your existing frontend.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button className="w-full rounded-lg bg-foreground px-8 py-3 text-sm font-semibold text-background transition-colors hover:bg-white sm:w-auto">
              Start for free
            </button>
            <button className="w-full rounded-lg border border-border px-8 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:w-auto">
              Talk to sales
            </button>
          </div>
          <p className="text-mono mt-6 text-[11px] uppercase tracking-widest text-muted-foreground/70">
            5 endpoints free forever · No credit card
          </p>
        </div>
      </div>
    </section>
  );
}
