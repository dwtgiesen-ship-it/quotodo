"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";

type Invite = { valid: boolean; email?: string; name?: string; role?: string; salonName?: string };

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/salonflow/auth/invite/${token}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setInvite(d); if (d.name) setName(d.name); })
      .catch(() => setInvite({ valid: false }));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/salonflow/auth/invite/${token}/accept`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, password }) });
      const data = await res.json();
      if (data.ok) window.location.href = data.redirect ?? "/salonflow/dashboard";
      else { setError(data.reason ?? "Could not accept invitation."); setBusy(false); }
    } catch { setError("Something went wrong. Try again."); setBusy(false); }
  }

  return (
    <div className="grid min-h-full place-items-center bg-[#fafbfc] px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <Logo className="size-9" />
          <span className="font-heading text-[20px] font-bold tracking-tight text-[#1f2a4d]">Schedulemode</span>
        </Link>
        <div className="rounded-2xl border border-[#eef0f2] bg-white p-7 shadow-sm">
          {invite === null ? (
            <div className="grid place-items-center py-8"><Loader2 className="size-6 animate-spin text-[#9097a3]" /></div>
          ) : !invite.valid ? (
            <>
              <h1 className="font-heading text-[20px] font-semibold text-[#1f2a4d]">Invitation not valid</h1>
              <p className="mt-1 text-[14px] text-[#5b6472]">This invite link has expired or was already used. Ask the salon owner to send a new one.</p>
              <Link href="/salonflow/login" className="mt-5 inline-block rounded-xl bg-[#1f2a4d] px-4 py-2.5 text-[14px] font-semibold text-white">Go to login</Link>
            </>
          ) : (
            <>
              <h1 className="font-heading text-[22px] font-semibold tracking-tight text-[#1f2a4d]">Join {invite.salonName}</h1>
              <p className="mt-1 text-[14px] text-[#5b6472]">You&apos;ve been invited as <span className="font-medium capitalize text-[#1f2a4d]">{invite.role}</span>. Set a password to get started.</p>
              <form onSubmit={submit} className="mt-6 space-y-3.5">
                <Field label="Your name" type="text" value={name} onChange={setName} autoFocus placeholder="Your full name" />
                <div>
                  <span className="mb-1.5 block text-[13px] font-medium text-[#3f4658]">Email</span>
                  <div className="rounded-xl border border-[#eef0f2] bg-[#f6f7f9] px-3.5 py-2.5 text-[14px] text-[#6b7280]">{invite.email}</div>
                </div>
                <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
                {error && <p className="rounded-lg bg-[#fdf0f2] px-3 py-2 text-[13px] text-[#d06277]">{error}</p>}
                <button disabled={busy || password.length < 8} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1f2a4d] py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#28365f] disabled:opacity-50">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <>Join the team <ArrowRight className="size-4" /></>}
                </button>
              </form>
            </>
          )}
        </div>
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
