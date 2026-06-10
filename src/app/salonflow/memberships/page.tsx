"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Plus, X } from "lucide-react";
import { useSalon } from "../lib/store";
import { useRole, Restricted } from "../components/role";
import { money } from "../lib/types";

export default function MembershipsPage() {
  const { can } = useRole();
  const { state, serviceById, clientById, subscribe, cancelMembership } = useSalon();
  const [adding, setAdding] = useState(false);

  if (!can("memberships")) return <Restricted />;

  const active = state.memberships.filter((m) => m.status === "active");

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[22px] font-semibold tracking-tight">Memberships</h1>
          <p className="text-[13px] text-sf-muted">{state.membershipPlans.length} plans · {active.length} active members</p>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-lg bg-sf-navy px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90">
          <Plus className="size-4" /> Add member
        </button>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {state.membershipPlans.map((p) => {
          const count = active.filter((m) => m.planId === p.id).length;
          return (
            <div key={p.id} className="rounded-xl border border-sf-line bg-sf-card p-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[16px] font-semibold">{p.name}</h3>
                <span className="text-[18px] font-semibold">{money(p.priceMinor, state.settings.currency)}<span className="text-[12px] font-normal text-sf-muted">/{p.interval}</span></span>
              </div>
              <div className="mt-3 space-y-1.5 text-[13px] text-sf-ink2">
                {p.includedServices.map((inc) => (
                  <div key={inc.serviceId} className="flex items-center gap-1.5"><Check className="size-3.5 text-[#4F9A57]" /> {inc.quantity}× {serviceById(inc.serviceId)?.name ?? "service"}/mo</div>
                ))}
                <div className="flex items-center gap-1.5"><Check className="size-3.5 text-[#4F9A57]" /> {p.discountPct}% off all services</div>
                <div className="flex items-center gap-1.5"><Check className="size-3.5 text-[#4F9A57]" /> {p.loyaltyMultiplier}× loyalty points</div>
              </div>
              <div className="mt-3 border-t border-sf-line pt-2 text-[12px] text-sf-muted">{count} active member{count === 1 ? "" : "s"}</div>
            </div>
          );
        })}
      </div>

      {/* Members */}
      <h2 className="mb-2 mt-6 text-[15px] font-semibold">Members</h2>
      <div className="overflow-hidden rounded-xl border border-sf-line bg-sf-card">
        {state.memberships.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-sf-muted">No members yet.</p>}
        {state.memberships.map((m) => {
          const client = clientById(m.clientId);
          const plan = state.membershipPlans.find((p) => p.id === m.planId);
          return (
            <div key={m.id} className="flex items-center gap-3 border-b border-sf-line px-4 py-3 last:border-0">
              <span className="grid size-8 place-items-center rounded-full bg-[#cfe4e2] text-[11px] font-semibold text-[#3f968c]">{client?.firstName[0]}{client?.lastName[0]}</span>
              <span className="flex-1 text-[14px] font-medium">{client?.firstName} {client?.lastName}</span>
              <span className="rounded-full bg-[#efe2f6] px-2.5 py-0.5 text-[12px] font-medium text-[#7b4fae]">{plan?.name}</span>
              <span className={`text-[12px] font-medium ${m.status === "active" ? "text-[#4F9A57]" : "text-sf-muted"}`}>{m.status}{m.renewsAt && m.status === "active" ? ` · renews ${m.renewsAt}` : ""}</span>
              {m.status === "active" && (
                <button onClick={() => { cancelMembership(m.id); toast.success("Membership cancelled"); }} className="rounded-md px-2 py-1 text-[12px] font-medium text-[#d06277] hover:bg-[#fdf0f2]">Cancel</button>
              )}
            </div>
          );
        })}
      </div>

      {adding && (
        <AddMember
          onClose={() => setAdding(false)}
          onAdd={(planId, clientId) => { subscribe(planId, clientId); toast.success("Member subscribed (mock billing)"); setAdding(false); }}
          plans={state.membershipPlans.map((p) => ({ id: p.id, name: p.name }))}
          clients={state.clients.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))}
        />
      )}
    </div>
  );
}

function AddMember({ onClose, onAdd, plans, clients }: { onClose: () => void; onAdd: (planId: string, clientId: string) => void; plans: { id: string; name: string }[]; clients: { id: string; name: string }[] }) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [clientId, setClientId] = useState("");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-sf-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-[16px] font-semibold">Add member</h3><button onClick={onClose} className="text-sf-muted"><X className="size-4" /></button></div>
        <label className="mb-1.5 block text-[12px] font-medium text-sf-ink2">Client</label>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="mb-3 w-full rounded-lg border border-sf-line px-3 py-2 text-[13px]"><option value="">Select…</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <label className="mb-1.5 block text-[12px] font-medium text-sf-ink2">Plan</label>
        <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="mb-4 w-full rounded-lg border border-sf-line px-3 py-2 text-[13px]">{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button disabled={!clientId || !planId} onClick={() => onAdd(planId, clientId)} className="w-full rounded-lg bg-sf-navy py-2.5 text-[14px] font-semibold text-white disabled:opacity-40">Subscribe</button>
      </div>
    </div>
  );
}
