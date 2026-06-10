"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Mail, Minus, Plus, Search, Sparkles, UserPlus, X } from "lucide-react";
import { useSalon } from "../lib/store";
import { useRole } from "../components/role";
import { money, type Client } from "../lib/types";

const TIER_STYLE: Record<Client["tier"], string> = {
  standard: "bg-sf-soft text-sf-ink2",
  silver: "bg-[#e4e7ec] text-sf-ink2",
  gold: "bg-[#fdf3d4] text-[#8a6d2f]",
  vip: "bg-[#efe2f6] text-[#7b4fae]",
};

const swatch = (a: string, b: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='160' height='160' fill='url(%23g)'/></svg>`)}`;
const SWATCHES = [["#DCEFD8", "#4F9A57"], ["#E8DCF4", "#8B5FB8"], ["#FBD9DE", "#D06277"], ["#D9E5F6", "#5777B0"]];

export default function ClientsPage() {
  const { state, serviceById } = useSalon();
  const { can } = useRole();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(state.clients[0]?.id ?? null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return state.clients.filter((c) => !q || `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(q));
  }, [state.clients, query]);

  const selected = state.clients.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col bg-sf-card">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-sf-line px-5">
          <h1 className="font-heading text-[18px] font-semibold">Clients <span className="text-sf-muted">({state.clients.length})</span></h1>
          {can("manageClients") && <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-lg bg-sf-navy px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90"><UserPlus className="size-4" /> Add client</button>}
        </div>
        <div className="border-b border-sf-line px-5 py-3">
          <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sf-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clients..." className="w-full rounded-lg bg-sf-soft py-2 pl-9 pr-3 text-[13px] outline-none placeholder:text-sf-muted focus:ring-2 focus:ring-[#dfe1e1]" /></div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => setSelectedId(c.id)} className={`flex w-full items-center gap-3 border-b border-sf-line px-5 py-3 text-left hover:bg-sf-soft ${selectedId === c.id ? "bg-sf-soft" : ""}`}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#cfe4e2] text-[12px] font-semibold text-[#3f968c]">{c.firstName[0]}{c.lastName[0] ?? ""}</span>
              <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium">{c.firstName} {c.lastName}</div><div className="truncate text-[12px] text-sf-muted">{c.email || c.phone}</div></div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${TIER_STYLE[c.tier]}`}>{c.tier}</span>
              <span className="w-16 text-right text-[13px] font-medium">{money(c.totalSpendMinor, state.settings.currency)}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="px-5 py-8 text-center text-[13px] text-sf-muted">No clients match “{query}”.</p>}
        </div>
      </div>

      {selected && <ClientPanel key={selected.id} client={selected} serviceName={(id) => serviceById(id)?.name ?? ""} />}
      {adding && <AddClientModal onClose={() => setAdding(false)} onCreated={(id) => { setSelectedId(id); setAdding(false); }} />}
    </div>
  );
}

function ClientPanel({ client, serviceName }: { client: Client; serviceName: (id: string) => string }) {
  const { state, updateClient, addLoyalty, subscribe, cancelMembership, sendMessage, addPhoto } = useSalon();
  const { can } = useRole();
  const [notes, setNotes] = useState(client.notes);
  const history = state.appointments.filter((a) => a.clientId === client.id).sort((a, b) => a.day - b.day || a.start - b.start);
  const membership = state.memberships.find((m) => m.clientId === client.id && m.status === "active");
  const plan = membership && state.membershipPlans.find((p) => p.id === membership.planId);
  const ledger = state.loyaltyLedger.filter((t) => t.clientId === client.id);
  const photos = state.photos.filter((p) => p.clientId === client.id);

  return (
    <aside className="hidden w-[380px] shrink-0 flex-col border-l border-sf-line bg-sf-card md:flex">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="grid size-12 place-items-center rounded-full bg-[#cfe4e2] text-[15px] font-semibold text-[#3f968c]">{client.firstName[0]}{client.lastName[0] ?? ""}</span>
        <div className="min-w-0"><div className="text-[16px] font-semibold">{client.firstName} {client.lastName}</div><div className="text-[12px] text-sf-muted">Client since {new Date(client.since).toLocaleDateString("en", { month: "long", year: "numeric" })}</div></div>
      </div>
      <div className="grid grid-cols-3 gap-2 px-5 pb-3">
        <Stat label="Spent" value={money(client.totalSpendMinor, state.settings.currency)} />
        <Stat label="Points" value={String(client.loyaltyPoints)} />
        <Stat label="Visits" value={String(history.length)} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 pb-4">
        {/* quick actions */}
        <div className="mb-3 flex gap-2">
          <button onClick={() => { sendMessage(client.id, "sms", `Hi ${client.firstName}, a quick note from ${state.settings.name}.`); toast.success("Message sent (demo)"); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sf-line py-2 text-[12px] font-medium hover:bg-sf-soft"><Mail className="size-3.5" /> Message</button>
          <a href="/salonflow/calendar" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sf-line py-2 text-[12px] font-medium hover:bg-sf-soft"><Sparkles className="size-3.5" /> Book</a>
        </div>

        {/* membership */}
        <Block title="Membership">
          {plan ? (
            <div className="flex items-center justify-between rounded-lg bg-[#efe2f6] px-3 py-2 text-[13px]"><span className="font-medium text-[#7b4fae]">{plan.name} · {money(plan.priceMinor, state.settings.currency)}/{plan.interval}</span>{can("memberships") && <button onClick={() => { cancelMembership(membership!.id); toast.success("Cancelled"); }} className="text-[12px] text-[#d06277]">Cancel</button>}</div>
          ) : can("memberships") ? (
            <div className="flex flex-wrap gap-1.5">{state.membershipPlans.map((p) => <button key={p.id} onClick={() => { subscribe(p.id, client.id); toast.success(`Subscribed to ${p.name}`); }} className="rounded-full bg-sf-soft px-2.5 py-1 text-[12px] font-medium hover:bg-[#e6e7e7]">+ {p.name}</button>)}</div>
          ) : <p className="text-[12px] text-sf-muted">No membership.</p>}
        </Block>

        {/* loyalty */}
        <Block title="Loyalty" action={can("manageClients") && (
          <div className="flex gap-1">
            <button onClick={() => { addLoyalty(client.id, 50, "earn", "Manual"); toast.success("+50 points"); }} className="grid size-6 place-items-center rounded-md bg-[#dcefd8] text-[#234A28]"><Plus className="size-3.5" /></button>
            <button onClick={() => { if (client.loyaltyPoints >= 100) { addLoyalty(client.id, -100, "redeem", "€10 off"); toast.success("Redeemed 100 pts"); } else toast.error("Not enough points"); }} className="grid size-6 place-items-center rounded-md bg-[#fbe2e6] text-[#5E2630]"><Minus className="size-3.5" /></button>
          </div>
        )}>
          {ledger.length === 0 ? <p className="text-[12px] text-sf-muted">No activity.</p> : (
            <div className="space-y-1">{ledger.slice(0, 5).map((t) => <div key={t.id} className="flex items-center justify-between text-[12px]"><span className="text-sf-ink2">{t.note || t.reason} · {t.createdAt}</span><span className={t.delta >= 0 ? "font-medium text-[#4F9A57]" : "font-medium text-[#d06277]"}>{t.delta >= 0 ? "+" : ""}{t.delta}</span></div>)}</div>
          )}
        </Block>

        {/* vertical profile */}
        {client.profileType !== "generic" && (
          <Block title={`${client.profileType === "pet" ? "Pet" : "Nail"} profile`}>
            <div className="space-y-1 text-[12px] text-sf-ink2">{Object.entries(client.profileData).map(([k, v]) => <div key={k}><span className="text-sf-muted capitalize">{k}:</span> {Array.isArray(v) ? v.join(", ") : String(v)}</div>)}</div>
          </Block>
        )}

        {/* photos */}
        <Block title="Photos" action={can("manageClients") && <button onClick={() => { const s = SWATCHES[photos.length % SWATCHES.length]; addPhoto(client.id, swatch(s[0], s[1]), "reference"); toast.success("Photo added"); }} className="grid size-6 place-items-center rounded-md bg-sf-soft"><ImagePlus className="size-3.5" /></button>}>
          {photos.length === 0 ? <p className="text-[12px] text-sf-muted">No photos.</p> : (
            <div className="flex flex-wrap gap-2">{photos.map((p) => (
              <div key={p.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.kind} className="size-14 rounded-lg object-cover" />
                <span className="absolute bottom-0.5 left-0.5 rounded bg-black/50 px-1 text-[9px] uppercase text-white">{p.kind}</span>
              </div>
            ))}</div>
          )}
        </Block>

        {/* notes */}
        <Block title="Notes">
          {can("manageClients") ? (
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => { if (notes !== client.notes) { updateClient(client.id, { notes }); toast.success("Notes saved"); } }} rows={2} placeholder="Add a note…" className="w-full resize-none rounded-lg border border-sf-line px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#dfe1e1]" />
          ) : <p className="text-[13px] text-sf-ink2">{client.notes || "—"}</p>}
        </Block>

        {/* history */}
        <Block title="Appointment history">
          {history.length === 0 ? <p className="text-[12px] text-sf-muted">No appointments yet.</p> : (
            <div className="space-y-1.5">{history.map((a) => <div key={a.id} className="flex items-center justify-between rounded-lg bg-sf-soft px-3 py-2 text-[13px]"><span>{serviceName(a.serviceId)}</span><span className="text-sf-muted capitalize">{a.status.replace("_", " ")}</span></div>)}</div>
          )}
        </Block>
      </div>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-sf-line p-2.5 text-center"><div className="text-[15px] font-semibold">{value}</div><div className="text-[11px] text-sf-muted">{label}</div></div>;
}
function Block({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="mb-3 border-t border-sf-line pt-3"><div className="mb-1.5 flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-sf-muted">{title}</span>{action}</div>{children}</div>;
}

function AddClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { addClient } = useSalon();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", notes: "" });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-sf-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-[16px] font-semibold">Add client</h3><button onClick={onClose} className="grid size-7 place-items-center rounded-md text-sf-muted hover:bg-sf-soft"><X className="size-4" /></button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><Field label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} /><Field label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} /></div>
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        </div>
        <button disabled={!form.firstName} onClick={() => { const c = addClient(form); toast.success("Client added"); onCreated(c.id); }} className="mt-5 w-full rounded-lg bg-sf-navy py-2.5 text-[14px] font-semibold text-white disabled:opacity-40">Create client</button>
      </div>
    </div>
  );
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="block"><span className="mb-1 block text-[12px] font-medium text-sf-ink2">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-sf-line px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#dfe1e1]" /></label>;
}
