import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid size-5 place-items-center rounded-sm bg-secondary">
            <Shield className="size-3 text-brand" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-foreground">SchemaGuard</span>
          <span className="text-xs text-muted-foreground">© 2026</span>
        </div>
        <div className="flex gap-8">
          {["Privacy", "Terms", "Security", "Status"].map((l) => (
            <a key={l} href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              {l}
            </a>
          ))}
        </div>
        <div className="text-mono text-xs text-muted-foreground/70">v2.4.0-stable</div>
      </div>
    </footer>
  );
}
