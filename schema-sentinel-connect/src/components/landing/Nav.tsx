import { Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Nav() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-6 place-items-center rounded-sm bg-brand">
            <Shield className="size-3.5 text-brand-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-semibold tracking-tight text-foreground">SchemaGuard</span>
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#product" className="transition-colors hover:text-foreground">Product</a>
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#compare" className="transition-colors hover:text-foreground">Compare</a>
          <a href="#docs" className="transition-colors hover:text-foreground">Docs</a>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">Sign in</Link>
          <Link to="/register" className="rounded-md bg-foreground px-3 py-1.5 text-sm font-semibold text-background transition-all hover:bg-white">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
