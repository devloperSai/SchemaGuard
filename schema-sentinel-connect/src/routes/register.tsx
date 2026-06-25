import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { auth } from "@/lib/mock";
import { AuthLayout, Field } from "./login";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — SchemaGuard" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) { setError("All fields are required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setTimeout(() => { auth.login(email, name); navigate({ to: "/dashboard" }); }, 400);
  };

  return <AuthLayout title="Create your account" subtitle="Start guarding your APIs in minutes">
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field icon={User} type="text" label="Full name" value={name} onChange={setName} placeholder="Ada Lovelace" />
      <Field icon={Mail} type="email" label="Work email" value={email} onChange={setEmail} placeholder="you@company.com" />
      <Field icon={Lock} type="password" label="Password" value={password} onChange={setPassword} placeholder="At least 6 characters" />
      {error && <p className="text-mono text-xs text-danger">{error}</p>}
      <button type="submit" disabled={loading}
        className="group flex h-10 w-full items-center justify-center gap-2 rounded-md bg-foreground text-sm font-semibold text-background transition-all hover:bg-white disabled:opacity-60">
        {loading ? "Creating…" : "Create account"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </form>
    <p className="mt-6 text-center text-xs text-muted-foreground">
      Already have an account? <Link to="/login" className="font-medium text-foreground hover:text-brand">Sign in</Link>
    </p>
  </AuthLayout>;
}
