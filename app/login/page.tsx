"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/authApi";
import { useAuthStore } from "@/lib/authStore";
import { ApiError } from "@/lib/apiclient";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center"><div className="pokeball" /></main>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/";
  const setSession = useAuthStore((s) => s.setSession);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      setSession(res.user, res.token);
      router.push(redirect);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Zurück
        </Link>

        <div className="glass-card p-6 sm:p-8 animate-fade-in-up">
          <h1 className="mb-1 text-xl font-black tracking-tight text-foreground">Anmelden</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Melde dich an, um Freunde einzuladen und deine Räume zu speichern.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="username">
                Benutzername
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="input-field"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="password">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="input-field"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 text-sm text-foreground/80" role="alert">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-1 px-4 py-3">
              {loading ? "Anmelden…" : "Anmelden"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Noch kein Konto?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Registrieren
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
