"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useSalon } from "../lib/store";
import { CATEGORY_STYLES, money, type Category, type Service } from "../lib/types";

const CATEGORIES: Category[] = ["express", "custom", "signature", "hydra", "scrub"];

const BLANK: Service = {
  id: "",
  name: "",
  category: "custom",
  durationMin: 60,
  priceMinor: 9000,
  depositMinor: 2000,
  bookableOnline: true,
};

export default function ServicesPage() {
  const { state, upsertService, removeService } = useSalon();
  const [editing, setEditing] = useState<Service | null>(null);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[22px] font-semibold tracking-tight">Services</h1>
          <p className="text-[13px] text-sf-muted">{state.services.length} services · prices in {state.settings.currency}</p>
        </div>
        <button onClick={() => setEditing({ ...BLANK })} className="flex items-center gap-1.5 rounded-lg bg-sf-navy px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90">
          <Plus className="size-4" /> Add service
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-sf-line bg-sf-card">
        {state.services.map((svc) => {
          const style = CATEGORY_STYLES[svc.category];
          return (
            <div key={svc.id} className="flex items-center gap-3 border-b border-sf-line px-4 py-3 last:border-0">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: style.accent }} />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium text-sf-ink">{svc.name}</div>
                <div className="text-[12px] text-sf-muted">{svc.durationMin} min{svc.depositMinor ? ` · ${money(svc.depositMinor, state.settings.currency)} deposit` : ""}{svc.bookableOnline ? "" : " · in-salon only"}</div>
              </div>
              <span className="text-[14px] font-semibold text-sf-ink">{money(svc.priceMinor, state.settings.currency)}</span>
              <button onClick={() => setEditing(svc)} className="grid size-8 place-items-center rounded-md text-sf-muted hover:bg-sf-soft"><Pencil className="size-4" /></button>
              <button onClick={() => removeService(svc.id)} className="grid size-8 place-items-center rounded-md text-[#d06277] hover:bg-[#fdf0f2]"><Trash2 className="size-4" /></button>
            </div>
          );
        })}
      </div>

      {editing && <EditModal service={editing} onClose={() => setEditing(null)} onSave={(s) => { upsertService(s); setEditing(null); }} />}
    </div>
  );
}

function EditModal({ service, onClose, onSave }: { service: Service; onClose: () => void; onSave: (s: Service) => void }) {
  const [form, setForm] = useState<Service>({ ...service, id: service.id || `svc-${Date.now()}` });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-sf-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold">{service.id ? "Edit service" : "Add service"}</h3>
          <button onClick={onClose} className="grid size-7 place-items-center rounded-md text-sf-muted hover:bg-sf-soft"><X className="size-4" /></button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-sf-ink2">Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-sf-line px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#dfe1e1]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-sf-ink2">Category</span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })} className="w-full rounded-lg border border-sf-line px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#dfe1e1]">
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_STYLES[c].label}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <NumField label="Duration (min)" value={form.durationMin} onChange={(v) => setForm({ ...form, durationMin: v })} />
            <NumField label="Price" value={form.priceMinor / 100} onChange={(v) => setForm({ ...form, priceMinor: Math.round(v * 100) })} />
            <NumField label="Deposit" value={(form.depositMinor ?? 0) / 100} onChange={(v) => setForm({ ...form, depositMinor: v ? Math.round(v * 100) : null })} />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-sf-ink2">
            <input type="checkbox" checked={form.bookableOnline} onChange={(e) => setForm({ ...form, bookableOnline: e.target.checked })} />
            Available for online booking
          </label>
        </div>
        <button disabled={!form.name} onClick={() => onSave(form)} className="mt-5 w-full rounded-lg bg-sf-navy py-2.5 text-[14px] font-semibold text-white disabled:opacity-40">
          Save service
        </button>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-sf-ink2">{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-lg border border-sf-line px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#dfe1e1]" />
    </label>
  );
}
