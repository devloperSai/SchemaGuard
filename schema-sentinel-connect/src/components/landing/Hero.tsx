import { ArrowRight, Play } from "lucide-react";
import { DriftTerminal } from "./DriftTerminal";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-20">
      <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" aria-hidden />
      <div className="absolute left-1/2 top-20 -z-10 size-[600px] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" aria-hidden />

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center text-center animate-fade-up">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-brand" />
            </span>
            <span className="text-mono text-[11px] font-medium uppercase tracking-widest text-brand">
              Now monitoring 4.2M endpoints
            </span>
          </div>

          <h1 className="max-w-[20ch] text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
            The circuit breaker for your API integrity
          </h1>

          <p className="mt-6 max-w-[58ch] text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            SchemaGuard intercepts API drift before it breaks your UI. Stop monitoring just status
            codes — start guarding the data structures that power your business.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <button className="group inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-glow ring-1 ring-brand transition-all hover:brightness-110">
              Deploy Proxy
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-card px-5 py-2.5 text-sm font-medium text-foreground ring-1 ring-border transition-all hover:bg-accent">
              <Play className="size-3.5 fill-foreground" />
              View Demo
            </button>
          </div>

          <div className="mt-6 text-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
            5-min setup · No code changes · Open source SDK
          </div>
        </div>

        <div className="relative mx-auto mt-20 max-w-4xl animate-fade-up [animation-delay:200ms]">
          <div className="absolute -inset-4 -z-10 bg-gradient-to-r from-brand/20 via-transparent to-brand/10 opacity-40 blur-3xl" aria-hidden />
          <DriftTerminal />
        </div>
      </div>
    </section>
  );
}
