"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/salonflow/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      const data = await res.json();
      if (data.ok) window.location.href = data.redirect ?? "/salonflow/onboarding";
      else { setError(data.reason ?? "Could not create account."); setBusy(false); }
    } catch { setError("Something went wrong. Try again."); setBusy(false); }
  }

  return (
    <div className="grid min-h-full place-items-center bg-[#fafbfc] px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-[#f0a8c0] to-[#9a7bd6] text-base font-bold text-white">S</span>
          <span className="font-heading text-[20px] font-bold tracking-tight text-[#1f2a4d]">SalonFlow</span>
        </Link>
        <div className="rounded-2xl border border-[#eef0f2] bg-white p-7 shadow-sm">
          <h1 className="font-heading text-[22px] font-semibold tracking-tight text-[#1f2a4d]">Start free</h1>
          <p className="mt-1 text-[14px] text-[#5b6472]">Create your salon — live in 10 minutes.</p>
          <form onSubmit={submit} className="mt-6 space-y-3.5">
            <Field label="Your name" type="text" value={name} onChange={setName} autoFocus placeholder="Alex Rivera" />
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@salon.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
            {error && <p className="rounded-lg bg-[#fdf0f2] px-3 py-2 text-[13px] text-[#d06277]">{error}</p>}
            <button disabled={busy || !email || password.length < 8} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1f2a4d] py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#28365f] disabled:opacity-50">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <>Create my salon <ArrowRight className="size-4" /></>}
            </button>
          </form>
          <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[#9097a3]"><Check className="size-3.5 text-[#4F9A57]" /> No card required · free to start</div>
        </div>
        <p className="mt-4 text-center text-[14px] text-[#5b6472]">
          Already have an account? <Link href="/salonflow/login" className="font-semibold text-[#1f2a4d] hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, autoFocus }: { label: string; type: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[#3f4658]">{label}</span>
      <input type={type} value={value} autoFocus={autoFocus} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-[#e6e7e7] px-3.5 py-2.5 text-[14px] outline-none transition focus:border-[#9a7bd6] focus:ring-2 focus:ring-[#ece0f8]" />
    </label>
  );
}
