"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { useSalon } from "../lib/store";
import { money, type Client } from "../lib/types";

const TIER_STYLE: Record<Client["tier"], string> = {
  standard: "bg-[#f0f1f1] text-[#6b7280]",
  silver: "bg-[#e4e7ec] text-[#475467]",
  gold: "bg-[#fdf3d4] text-[#8a6d2f]",
  vip: "bg-[#efe2f6] text-[#7b4fae]",
};

export default function ClientsPage() {
  const { state, serviceById } = useSalon();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(state.clients[0]?.id ?? null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return state.clients.filter((c) =>
      !q || `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(q),
    );
  }, [state.clients, query]);

  const selected = state.clients.find((c) => c.id === selectedId) ?? null;
  const history = selected
    ? state.appointments
        .filter((a) => a.clientId === selected.id)
        .sort((a, b) => a.day - b.day || a.start - b.start)
    : [];

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e6e7e7] px-5">
          <h1 className="text-[18px] font-semibold">Clients <span className="text-[#9fa5a4]">({state.clients.length})</span></h1>
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-lg bg-[#1f2a4d] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#28356180]">
            <UserPlus className="size-4" /> Add client
          </button>
        </div>
        <div className="border-b border-[#eef0f2] px-5 py-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9fa5a4]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clients..." className="w-full rounded-lg bg-[#f4f5f4] py-2 pl-9 pr-3 text-[13px] outline-none placeholder:text-[#9fa5a4] focus:ring-2 focus:ring-[#dfe1e1]" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => setSelectedId(c.id)} className={`flex w-full items-center gap-3 border-b border-[#f0f1f1] px-5 py-3 text-left hover:bg-[#f8f9f9] ${selectedId === c.id ? "bg-[#f4f6fb]" : ""}`}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#cfe4e2] text-[12px] font-semibold text-[#3f968c]">{c.firstName[0]}{c.lastName[0] ?? ""}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium text-[#2c2f2e]">{c.firstName} {c.lastName}</div>
                <div className="truncate text-[12px] text-[#9fa5a4]">{c.email || c.phone}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${TIER_STYLE[c.tier]}`}>{c.tier}</span>
              <span className="w-16 text-right text-[13px] font-medium text-[#2c2f2e]">{money(c.totalSpendMinor, state.settings.currency)}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="px-5 py-8 text-center text-[13px] text-[#9fa5a4]">No clients match “{query}”.</p>}
        </div>
      </div>

      {selected && (
        <aside className="hidden w-[360px] shrink-0 flex-col border-l border-[#e6e7e7] bg-white md:flex">
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="grid size-12 place-items-center rounded-full bg-[#cfe4e2] text-[15px] font-semibold text-[#3f968c]">{selected.firstName[0]}{selected.lastName[0] ?? ""}</span>
            <div className="min-w-0">
              <div className="text-[16px] font-semibold">{selected.firstName} {selected.lastName}</div>
              <div className="text-[12px] text-[#9fa5a4]">Client since {new Date(selected.since).toLocaleDateString("en", { month: "long", year: "numeric" })}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 px-5 pb-4">
            <Stat label="Spent" value={money(selected.totalSpendMinor, state.settings.currency)} />
            <Stat label="Points" value={String(selected.loyaltyPoints)} />
            <Stat label="Visits" value={String(history.length)} />
          </div>
          {selected.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-5 pb-3">
              {selected.tags.map((t) => <span key={t} className="rounded-full bg-[#f0f1f1] px-2.5 py-0.5 text-[11px] font-medium text-[#6b7280]">{t}</span>)}
            </div>
          )}
          {selected.notes && (
            <div className="mx-5 mb-3 rounded-lg bg-[#fdf3d4] px-3 py-2 text-[13px] text-[#8a6d2f]">{selected.notes}</div>
          )}
          <div className="min-h-0 flex-1 overflow-auto border-t border-[#eef0f2] px-5 py-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9fa5a4]">Contact</div>
            <div className="space-y-1 text-[13px] text-[#3f4544]">
              <div>{selected.email || "—"}</div>
              <div>{selected.phone || "—"}</div>
            </div>
            <div className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#9fa5a4]">Appointment history</div>
            <div className="space-y-1.5">
              {history.length === 0 && <p className="text-[13px] text-[#9fa5a4]">No appointments yet.</p>}
              {history.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-[#f8f9f9] px-3 py-2 text-[13px]">
                  <span className="text-[#2c2f2e]">{serviceById(a.serviceId)?.name}</span>
                  <span className="text-[#9fa5a4] capitalize">{a.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}

      {adding && <AddClientModal onClose={() => setAdding(false)} onCreated={(id) => { setSelectedId(id); setAdding(false); }} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#eef0f2] p-2.5 text-center">
      <div className="text-[15px] font-semibold text-[#2c2f2e]">{value}</div>
      <div className="text-[11px] text-[#9fa5a4]">{label}</div>
    </div>
  );
}

function AddClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { addClient } = useSalon();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", notes: "" });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold">Add client</h3>
          <button onClick={onClose} className="grid size-7 place-items-center rounded-md text-[#9fa5a4] hover:bg-[#f4f5f4]"><X className="size-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
            <Field label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
          </div>
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        </div>
        <button
          disabled={!form.firstName}
          onClick={() => { const c = addClient(form); onCreated(c.id); }}
          className="mt-5 w-full rounded-lg bg-[#1f2a4d] py-2.5 text-[14px] font-semibold text-white disabled:opacity-40"
        >
          Create client
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-[#6b7280]">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#dfe1e1]" />
    </label>
  );
}
