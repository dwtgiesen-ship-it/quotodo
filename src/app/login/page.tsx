"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Logo } from "@/components/app-header";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next?.startsWith("/") ? next : "/";
    } else {
      setError("Onjuist wachtwoord");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-line bg-card p-6 shadow-sm">
        <Logo />
        <p className="mt-4 text-sm text-ink2">Jouw kast is privé. Log in om verder te gaan.</p>
        <label className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2.5 focus-within:border-ink2">
          <Lock className="size-4 text-muted" />
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wachtwoord"
            className="w-full bg-transparent text-[16px] outline-none"
          />
        </label>
        {error && <p className="mt-2 text-sm text-accent">{error}</p>}
        <button disabled={busy || !password} className="mt-4 w-full rounded-full bg-ink py-2.5 font-medium text-bg disabled:opacity-50">
          Inloggen
        </button>
      </form>
    </main>
  );
}
