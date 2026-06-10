"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Copy, Mail, Pencil, Plus, Trash2, X } from "lucide-react";
import { useSalon } from "../lib/store";
import { useRole, Restricted } from "../components/role";
import type { Staff, Weekday, WeeklyHours } from "../lib/types";

const DAYS: { id: Weekday; label: string }[] = [
  { id: "mon", label: "Monday" }, { id: "tue", label: "Tuesday" }, { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" }, { id: "fri", label: "Friday" }, { id: "sat", label: "Saturday" }, { id: "sun", label: "Sunday" },
];

const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const toMin = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };

export default function SettingsPage() {
  const { can } = useRole();
  const { state, updateSettings } = useSalon();
  if (!can("settings")) return <Restricted />;

  const hours = state.settings.weeklyHours;

  function setDay(day: Weekday, value: [number, number] | null) {
    updateSettings({ weeklyHours: { ...hours, [day]: value } as WeeklyHours });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h1 className="mb-5 font-heading text-[22px] font-semibold tracking-tight">Settings</h1>

      <Section title="Business">
        <Row label="Business name">
          <input value={state.settings.name} onChange={(e) => updateSettings({ name: e.target.value })} className="w-full rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#dfe1e1]" />
        </Row>
        <Row label="Currency">
          <select value={state.settings.currency} onChange={(e) => updateSettings({ currency: e.target.value })} className="rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px]"><option>EUR</option><option>GBP</option><option>USD</option></select>
        </Row>
        <Row label="Calendar sync">
          <Link href="/salonflow/settings/calendar" className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px] font-medium hover:bg-[#f4f5f4]">
            {state.settings.calendarConnected ? <><Check className="size-4 text-[#4F9A57]" /> Manage calendar sync</> : "Set up calendar sync"}
          </Link>
        </Row>
      </Section>

      <Section title="Opening hours">
        <div className="space-y-2">
          {DAYS.map((d) => {
            const h = hours[d.id];
            const open = h != null;
            return (
              <div key={d.id} className="flex items-center gap-3">
                <span className="w-24 text-[13px] font-medium">{d.label}</span>
                <button onClick={() => setDay(d.id, open ? null : [540, 1080])} className={`w-20 rounded-md px-2 py-1 text-[12px] font-medium ${open ? "bg-[#dcefd8] text-[#234A28]" : "bg-[#f0f1f1] text-[#9fa5a4]"}`}>{open ? "Open" : "Closed"}</button>
                {open && (
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <input type="time" value={toHHMM(h![0])} onChange={(e) => setDay(d.id, [toMin(e.target.value), h![1]])} className="rounded-md border border-[#e6e7e7] px-2 py-1" />
                    <span className="text-[#9fa5a4]">–</span>
                    <input type="time" value={toHHMM(h![1])} onChange={(e) => setDay(d.id, [h![0], toMin(e.target.value)])} className="rounded-md border border-[#e6e7e7] px-2 py-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <TeamSection />
      <InviteSection />

      <p className="mt-6 text-center text-[12px] text-[#9fa5a4]">Changes save automatically to the API. Onboarding wizard: <a href="/salonflow/onboarding" className="underline">re-run setup</a>.</p>
    </div>
  );
}

function TeamSection() {
  const { state, upsertStaff, removeStaff } = useSalon();
  const [editing, setEditing] = useState<Staff | null>(null);
  const blank = (): Staff => ({ id: `stf-${Date.now()}`, name: "", initials: "", color: "#5777B0", role: "staff", bookableOnline: true, serviceIds: [], weeklyHours: state.settings.weeklyHours });

  return (
    <Section title="Team" action={<button onClick={() => setEditing(blank())} className="flex items-center gap-1 rounded-md bg-[#1f2a4d] px-2.5 py-1.5 text-[12px] font-medium text-white"><Plus className="size-3.5" /> Add</button>}>
      <div className="space-y-1.5">
        {state.staff.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-lg border border-[#eef0f2] px-3 py-2">
            <span className="grid size-8 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: m.color }}>{m.initials}</span>
            <div className="flex-1"><div className="text-[14px] font-medium">{m.name}</div><div className="text-[12px] text-[#9fa5a4] capitalize">{m.role} · {m.serviceIds.length} services</div></div>
            <button onClick={() => setEditing(m)} className="grid size-8 place-items-center rounded-md text-[#9fa5a4] hover:bg-[#f4f5f4]"><Pencil className="size-4" /></button>
            {state.staff.length > 1 && <button onClick={() => { removeStaff(m.id); toast.success("Team member removed"); }} className="grid size-8 place-items-center rounded-md text-[#d06277] hover:bg-[#fdf0f2]"><Trash2 className="size-4" /></button>}
          </div>
        ))}
      </div>
      {editing && <StaffModal staff={editing} services={state.services.map((s) => ({ id: s.id, name: s.name }))} onClose={() => setEditing(null)} onSave={(s) => { upsertStaff(s); toast.success("Team member saved"); setEditing(null); }} />}
    </Section>
  );
}

function StaffModal({ staff, services, onClose, onSave }: { staff: Staff; services: { id: string; name: string }[]; onClose: () => void; onSave: (s: Staff) => void }) {
  const [form, setForm] = useState<Staff>(staff);
  const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const toggle = (id: string) => setForm((f) => ({ ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id] }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-[16px] font-semibold">{staff.name ? "Edit member" : "Add member"}</h3><button onClick={onClose} className="text-[#9fa5a4]"><X className="size-4" /></button></div>
        <label className="mb-1.5 block text-[12px] font-medium text-[#6b7280]">Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, initials: initials(e.target.value) })} className="mb-3 w-full rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px]" />
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div><label className="mb-1.5 block text-[12px] font-medium text-[#6b7280]">Role</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Staff["role"] })} className="w-full rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px]"><option value="owner">Owner</option><option value="manager">Manager</option><option value="staff">Staff</option><option value="receptionist">Receptionist</option></select></div>
          <div><label className="mb-1.5 block text-[12px] font-medium text-[#6b7280]">Colour</label><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 w-full rounded-lg border border-[#e6e7e7]" /></div>
        </div>
        <label className="mb-1.5 block text-[12px] font-medium text-[#6b7280]">Services performed</label>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {services.map((s) => <button key={s.id} onClick={() => toggle(s.id)} className={`rounded-full px-2.5 py-1 text-[12px] ${form.serviceIds.includes(s.id) ? "bg-[#1f2a4d] text-white" : "bg-[#f0f1f1] text-[#6b7280]"}`}>{s.name}</button>)}
        </div>
        <label className="mb-4 flex items-center gap-2 text-[13px]"><input type="checkbox" checked={form.bookableOnline} onChange={(e) => setForm({ ...form, bookableOnline: e.target.checked })} /> Available for online booking</label>
        <button disabled={!form.name} onClick={() => onSave(form)} className="w-full rounded-lg bg-[#1f2a4d] py-2.5 text-[14px] font-semibold text-white disabled:opacity-40">Save</button>
      </div>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-[#e6e7e7] bg-white p-5">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-[15px] font-semibold">{title}</h2>{action}</div>
      {children}
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3 flex items-center justify-between gap-4 last:mb-0"><span className="text-[13px] text-[#6b7280]">{label}</span><div className="flex-1 text-right [&>*]:ml-auto [&>input]:max-w-xs">{children}</div></div>;
}

const INVITE_ROLES = [
  { id: "staff", label: "Staff" },
  { id: "manager", label: "Manager" },
  { id: "receptionist", label: "Receptionist" },
];

type Invite = { id: string; email: string; name: string; role: string; token: string; expiresAt: string };

function InviteSection() {
  const { user } = useRole();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviting, setInviting] = useState(false);

  function load() {
    fetch("/api/salonflow/auth/invite", { cache: "no-store" }).then((r) => r.json()).then((d) => setInvites(d.invitations ?? [])).catch(() => {});
  }
  useEffect(() => { if (user) load(); }, [user]);

  async function copyLink(token: string) {
    const link = `${location.origin}/salonflow/invite/${token}`;
    try { await navigator.clipboard.writeText(link); toast.success("Invite link copied — send it to your teammate"); }
    catch { toast.success("Invite link: " + link); }
  }
  async function revoke(id: string) {
    await fetch(`/api/salonflow/auth/invite?id=${id}`, { method: "DELETE" });
    toast.success("Invitation revoked");
    load();
  }

  if (!user) {
    return (
      <Section title="Invite your team">
        <p className="text-[13px] text-[#9fa5a4]">Create an account to invite team members who can log in with their own roles. <Link href="/salonflow/signup" className="font-medium text-[#1f2a4d] underline">Start free</Link>.</p>
      </Section>
    );
  }

  return (
    <Section title="Invite your team" action={<button onClick={() => setInviting(true)} className="flex items-center gap-1 rounded-md bg-[#1f2a4d] px-2.5 py-1.5 text-[12px] font-medium text-white"><Mail className="size-3.5" /> Invite</button>}>
      {invites.length === 0 ? (
        <p className="text-[13px] text-[#9fa5a4]">No pending invitations. Invite a teammate and share their link — they set a password and join with the role you choose.</p>
      ) : (
        <div className="space-y-1.5">
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-[#eef0f2] px-3 py-2">
              <Mail className="size-4 text-[#9fa5a4]" />
              <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium">{inv.email}</div><div className="text-[12px] text-[#9fa5a4] capitalize">{inv.role} · pending</div></div>
              <button onClick={() => copyLink(inv.token)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-[#5777B0] hover:bg-[#eef2fb]"><Copy className="size-3.5" /> Copy link</button>
              <button onClick={() => revoke(inv.id)} className="grid size-7 place-items-center rounded-md text-[#9fa5a4] hover:bg-[#fdf0f2] hover:text-[#d06277]"><X className="size-4" /></button>
            </div>
          ))}
        </div>
      )}
      {inviting && <InviteModal onClose={() => setInviting(false)} onCreated={(token) => { copyLink(token); load(); setInviting(false); }} />}
    </Section>
  );
}

function InviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true); setError("");
    const res = await fetch("/api/salonflow/auth/invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, role }) });
    const data = await res.json();
    if (data.ok) onCreated(data.token);
    else { setError(data.reason ?? "Could not create invite."); setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-[16px] font-semibold">Invite a team member</h3><button onClick={onClose} className="text-[#9fa5a4]"><X className="size-4" /></button></div>
        <label className="mb-1.5 block text-[12px] font-medium text-[#6b7280]">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@email.com" className="mb-3 w-full rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#dfe1e1]" />
        <label className="mb-1.5 block text-[12px] font-medium text-[#6b7280]">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="mb-4 w-full rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px]">
          {INVITE_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        {error && <p className="mb-3 rounded-lg bg-[#fdf0f2] px-3 py-2 text-[12px] text-[#d06277]">{error}</p>}
        <button disabled={busy || !email} onClick={submit} className="w-full rounded-lg bg-[#1f2a4d] py-2.5 text-[14px] font-semibold text-white disabled:opacity-40">Create invite link</button>
        <p className="mt-2 text-center text-[11px] text-[#9fa5a4]">We&apos;ll generate a link to share (no email is sent in the demo).</p>
      </div>
    </div>
  );
}
