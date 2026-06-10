"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Activity, ChevronLeft, Plug, RefreshCw, Unplug, Zap } from "lucide-react";
import { useSalon } from "../../lib/store";
import { useRole, Restricted } from "../../components/role";
import { DAYS } from "../../lib/types";

type Conn = { id: string; staffId: string; provider: string; status: string; externalAccount: string; lastSyncedAt: string | null; lastError: string; live: boolean };
type Status = {
  connections: Conn[];
  logs: { id: string; level: string; event: string; message: string; connectionId: string; at: string }[];
  queue: { queued: number; running: number; dead: number };
  externalBusyBlocks: number;
};

const PROVIDERS: { id: "google" | "microsoft" | "apple"; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "microsoft", label: "Microsoft 365" },
  { id: "apple", label: "Apple" },
];

const STATUS_STYLE: Record<string, string> = {
  active: "bg-[#dcefd8] text-[#234A28]",
  error: "bg-[#fbe2e6] text-[#5E2630]",
  paused: "bg-[#fdf3d4] text-[#8a6d2f]",
  disconnected: "bg-[#f0f1f1] text-[#9fa5a4]",
};

export default function CalendarSyncPage() {
  const { can } = useRole();
  const { state } = useSalon();
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const r = await fetch("/api/salonflow/sync/status", { cache: "no-store" }); if (r.ok) setStatus(await r.json()); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000); // near-real-time monitoring
    return () => clearInterval(t);
  }, [load]);

  if (!can("settings")) return <Restricted />;

  async function connect(staffId: string, provider: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/salonflow/sync/connect", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ staffId, provider }) });
      const d = await r.json();
      if (d.redirectUrl) { window.location.href = d.redirectUrl; return; } // live OAuth
      toast.success(`Connected ${provider} (demo)`); await load();
    } finally { setBusy(false); }
  }
  async function disconnect(connectionId: string) {
    await fetch("/api/salonflow/sync/disconnect", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ connectionId }) });
    toast.success("Disconnected"); await load();
  }
  async function run() {
    setBusy(true);
    try { const r = await fetch("/api/salonflow/sync/run", { method: "POST" }); const d = await r.json(); toast.success(`Processed ${d.processed} job(s)${d.failed ? `, ${d.failed} failed` : ""}`); await load(); }
    finally { setBusy(false); }
  }
  async function simulate(connectionId: string) {
    setBusy(true);
    try {
      const day = 3, start = 11; // Sat 11:00 — a visible, normally-free slot
      const r = await fetch("/api/salonflow/sync/simulate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ connectionId, summary: "Dentist appointment", day, start, durationH: 1.5 }) });
      if (r.ok) { setStatus(await r.json()); toast.success(`External event synced → ${DAYS[day].label} ${start}:00 now blocks bookings`); }
    } finally { setBusy(false); }
  }

  const connByStaff = (id: string) => status?.connections.filter((c) => c.staffId === id && c.status !== "disconnected") ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <div className="mb-1 flex items-center gap-2">
        <Link href="/salonflow/settings" className="grid size-7 place-items-center rounded-md text-[#9fa5a4] hover:bg-white"><ChevronLeft className="size-4" /></Link>
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">Calendar sync</h1>
      </div>
      <p className="mb-5 ml-9 text-[13px] text-[#9fa5a4]">Two-way, real-time sync with Google, Microsoft 365 &amp; Apple. Personal events block bookings; SalonFlow appointments mirror to staff calendars.</p>

      {/* live status strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Plug} label="Connections" value={String(status?.connections.filter((c) => c.status !== "disconnected").length ?? 0)} />
        <Stat icon={Activity} label="Queue" value={`${status?.queue.queued ?? 0} queued`} sub={`${status?.queue.dead ?? 0} dead`} />
        <Stat icon={Zap} label="Busy blocks" value={String(status?.externalBusyBlocks ?? 0)} sub="from calendars" />
        <button onClick={run} disabled={busy} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e6e7e7] bg-white p-3 text-[13px] font-medium hover:bg-[#f8f9f9] disabled:opacity-50"><RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} /> Run sync now</button>
      </div>

      {/* per-staff connections */}
      <div className="space-y-2">
        {state.staff.map((m) => {
          const conns = connByStaff(m.id);
          const connectedProviders = new Set(conns.map((c) => c.provider));
          return (
            <div key={m.id} className="rounded-xl border border-[#e6e7e7] bg-white p-4">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: m.color }}>{m.initials}</span>
                <span className="text-[14px] font-medium">{m.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {conns.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-lg border border-[#eef0f2] py-1.5 pl-3 pr-1.5 text-[13px]">
                    <span className="font-medium capitalize">{c.provider}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[c.status] ?? STATUS_STYLE.disconnected}`}>{c.status}</span>
                    {!c.live && <span className="rounded-full bg-[#efe2f6] px-2 py-0.5 text-[10px] font-medium text-[#7b4fae]">demo</span>}
                    {c.lastSyncedAt && <span className="text-[11px] text-[#9fa5a4]">· synced {new Date(c.lastSyncedAt).toLocaleTimeString()}</span>}
                    <button onClick={() => simulate(c.id)} disabled={busy} className="ml-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#5777B0] hover:bg-[#eef2fb]" title="Demo: simulate an external event">Simulate</button>
                    <button onClick={() => disconnect(c.id)} className="grid size-6 place-items-center rounded-md text-[#9fa5a4] hover:bg-[#fdf0f2] hover:text-[#d06277]"><Unplug className="size-3.5" /></button>
                  </div>
                ))}
                {PROVIDERS.filter((p) => !connectedProviders.has(p.id)).map((p) => (
                  <button key={p.id} onClick={() => connect(m.id, p.id)} disabled={busy} className="flex items-center gap-1.5 rounded-lg border border-dashed border-[#d6d8d8] px-3 py-1.5 text-[13px] text-[#6b7280] hover:bg-[#f8f9f9] disabled:opacity-50">
                    <Plug className="size-3.5" /> Connect {p.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* activity log */}
      <h2 className="mb-2 mt-6 text-[15px] font-semibold">Sync activity</h2>
      <div className="overflow-hidden rounded-xl border border-[#e6e7e7] bg-white">
        {(status?.logs.length ?? 0) === 0 && <p className="px-4 py-6 text-center text-[13px] text-[#9fa5a4]">No sync activity yet. Connect a calendar to begin.</p>}
        {status?.logs.map((l) => (
          <div key={l.id} className="flex items-center gap-3 border-b border-[#f0f1f1] px-4 py-2 text-[13px] last:border-0">
            <span className={`size-2 shrink-0 rounded-full ${l.level === "error" ? "bg-[#d06277]" : l.level === "warn" ? "bg-[#e6b54a]" : "bg-[#4F9A57]"}`} />
            <span className="w-40 shrink-0 font-medium">{l.event}</span>
            <span className="flex-1 truncate text-[#6b7280]">{l.message}</span>
            <span className="shrink-0 text-[11px] text-[#9fa5a4]">{new Date(l.at).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[12px] text-[#9fa5a4]">Live providers activate when their OAuth credentials are set (Google/Microsoft) or app-specific password (Apple). Until then connections run in demo mode through the same engine. See docs/salonflow/08-calendar-sync.md.</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Plug; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[#e6e7e7] bg-white p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[#9fa5a4]"><Icon className="size-3.5" /> {label}</div>
      <div className="mt-1 text-[18px] font-semibold leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-[#9fa5a4]">{sub}</div>}
    </div>
  );
}
