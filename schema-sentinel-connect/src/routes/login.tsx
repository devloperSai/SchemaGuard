import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shield, Mail, Lock, ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { auth } from "@/lib/mock";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — SchemaGuard" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading(true);
    setTimeout(() => { auth.login(email); navigate({ to: "/dashboard" }); }, 400);
  };

  return <AuthLayout title="Welcome back" subtitle="Sign in to monitor your API integrity">
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field icon={Mail} type="email" label="Email" value={email} onChange={setEmail} placeholder="you@company.com" />
      <Field icon={Lock} type="password" label="Password" value={password} onChange={setPassword} placeholder="••••••••" />
      {error && <p className="text-mono text-xs text-danger">{error}</p>}
      <button type="submit" disabled={loading}
        className="group flex h-10 w-full items-center justify-center gap-2 rounded-md bg-foreground text-sm font-semibold text-background transition-all hover:bg-white disabled:opacity-60">
        {loading ? "Signing in…" : "Sign in"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </form>
    <p className="mt-6 text-center text-xs text-muted-foreground">
      No account? <Link to="/register" className="font-medium text-foreground hover:text-brand">Create one</Link>
    </p>
  </AuthLayout>;
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-border/60 bg-surface-2/30 lg:block">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-sm bg-brand">
              <Shield className="size-4 text-brand-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-tight">SchemaGuard</span>
          </Link>
          <div>
            <p className="text-mono mb-3 text-xs uppercase tracking-widest text-brand">// system status</p>
            <h2 className="text-3xl font-semibold tracking-tight">Catch schema drift before your users do.</h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Content-aware monitoring for every endpoint that powers your product. Field-level diffs, severity scoring, and automatic fallback.
            </p>
            <div className="mt-8 flex items-center gap-6 text-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-brand animate-pulse-soft" />proxy.online</span>
              <span>uptime 99.99%</span>
              <span>p50 12ms</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid size-6 place-items-center rounded-sm bg-brand">
              <Shield className="size-3.5 text-brand-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-tight">SchemaGuard</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({ icon: Icon, label, type, value, onChange, placeholder }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; type: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-mono mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="h-10 w-full rounded-md border border-border bg-surface-2/60 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-brand/50 focus:bg-surface-2" />
      </div>
    </label>
  );
}
