import { Check, Minus } from "lucide-react";

const rows = [
  { k: "Uptime & status code alerts", legacy: true, sg: "Yes" },
  { k: "Response time monitoring", legacy: true, sg: "Yes" },
  { k: "Schema drift detection", legacy: false, sg: "Real-time" },
  { k: "Field-level severity classification", legacy: false, sg: "Automatic" },
  { k: "Knows which fields your UI consumes", legacy: false, sg: "Yes" },
  { k: "Auto fallback to last good data", legacy: false, sg: "Integrated" },
  { k: "Zero frontend code changes", legacy: false, sg: "Yes" },
];

export function Compare() {
  return (
    <section id="compare" className="bg-card/30 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <div className="text-mono mb-4 text-[11px] uppercase tracking-widest text-brand">
            How we compare
          </div>
          <h2 className="text-balance text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Built for the content layer, not just the envelope.
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl bg-background ring-1 ring-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-card/50">
                <th className="px-6 py-4 font-medium text-muted-foreground">Capability</th>
                <th className="px-6 py-4 text-center font-medium text-muted-foreground">
                  Datadog · UptimeRobot · Postman
                </th>
                <th className="px-6 py-4 text-center font-medium text-brand">SchemaGuard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.k} className="transition-colors hover:bg-card/40">
                  <td className="px-6 py-4 text-foreground">{r.k}</td>
                  <td className="px-6 py-4 text-center">
                    {r.legacy ? (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Check className="size-4 text-muted-foreground" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground/40">
                        <Minus className="size-4" /> No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 font-medium text-brand">
                      <Check className="size-4" /> {r.sg}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
