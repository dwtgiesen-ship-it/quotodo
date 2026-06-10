"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Copy, Sparkles } from "lucide-react";
import { useSalon } from "../lib/store";
import { CATEGORY_STYLES, money, type Service } from "../lib/types";

const VERTICALS: { id: string; label: string }[] = [
  { id: "hair", label: "Hair salon" },
  { id: "barber", label: "Barbershop" },
  { id: "nails", label: "Nail salon" },
  { id: "lash", label: "Lash & brow" },
  { id: "beauty", label: "Beauty salon" },
  { id: "spa", label: "Spa" },
  { id: "pet", label: "Pet grooming" },
];

const STEPS = ["Business", "Services", "Team", "Hours", "Calendar", "Go live"];

export default function OnboardingPage() {
  const { state, updateSettings, upsertService } = useSalon();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.settings.name);
  const [vertical, setVertical] = useState(state.settings.vertical);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  function finishBusiness() {
    updateSettings({ name, vertical: vertical as typeof state.settings.vertical });
    next();
  }
  function connectCalendar() {
    updateSettings({ calendarConnected: true });
    next();
  }
  function goLive() {
    updateSettings({ onboardingComplete: true });
    setStep(STEPS.length - 1);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-5 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${i < step ? "bg-[#4F9A57] text-white" : i === step ? "bg-[#1f2a4d] text-white" : "bg-[#e6e7e7] text-[#9fa5a4]"}`}>
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? "bg-[#4F9A57]" : "bg-[#e6e7e7]"}`} />}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#e6e7e7] bg-white p-6 shadow-sm">
        {step === 0 && (
          <Wizard title="Tell us about your business" subtitle="This pre-fills smart defaults for your vertical.">
            <Label>Business name</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mb-4 w-full rounded-lg border border-[#e6e7e7] px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#dfe1e1]" />
            <Label>What kind of business?</Label>
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {VERTICALS.map((v) => (
                <button key={v.id} onClick={() => setVertical(v.id as typeof vertical)} className={`rounded-lg border px-3 py-2.5 text-[13px] ${vertical === v.id ? "border-[#1f2a4d] bg-[#f4f6fb] font-medium" : "border-[#e6e7e7] hover:bg-[#f8f9f9]"}`}>
                  {v.label}
                </button>
              ))}
            </div>
            <Primary disabled={!name} onClick={finishBusiness}>Continue</Primary>
          </Wizard>
        )}

        {step === 1 && (
          <Wizard title="Your services" subtitle="We seeded these for you — edit anytime in Services.">
            <div className="mb-4 space-y-1.5">
              {state.services.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg border border-[#eef0f2] px-3 py-2 text-[13px]">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: CATEGORY_STYLES[s.category].accent }} />
                  <span className="flex-1">{s.name}</span>
                  <span className="text-[#9fa5a4]">{s.durationMin}m</span>
                  <span className="font-medium">{money(s.priceMinor, state.settings.currency)}</span>
                </div>
              ))}
            </div>
            <AddQuickService onAdd={upsertService} currency={state.settings.currency} />
            <Primary onClick={next}>Looks good</Primary>
          </Wizard>
        )}

        {step === 2 && (
          <Wizard title="Your team" subtitle="Invite staff or run solo — you can add people later.">
            <div className="mb-5 space-y-1.5">
              {state.staff.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 rounded-lg border border-[#eef0f2] px-3 py-2 text-[13px]">
                  <span className="grid size-7 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: m.color }}>{m.initials}</span>
                  <span className="flex-1">{m.name}</span>
                  <span className="text-[#9fa5a4] capitalize">{m.role}</span>
                </div>
              ))}
            </div>
            <Primary onClick={next}>Continue</Primary>
          </Wizard>
        )}

        {step === 3 && (
          <Wizard title="Opening hours" subtitle="Sensible defaults applied — fine-tune per staff member later.">
            <div className="mb-5 space-y-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="flex items-center justify-between rounded-lg bg-[#f8f9f9] px-3 py-2 text-[13px]">
                  <span className="font-medium">{d}</span>
                  <span className="text-[#6b7280]">9:00 AM – 6:00 PM</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-[#f8f9f9] px-3 py-2 text-[13px]">
                <span className="font-medium">Sun</span>
                <span className="text-[#9fa5a4]">Closed</span>
              </div>
            </div>
            <Primary onClick={next}>Continue</Primary>
          </Wizard>
        )}

        {step === 4 && (
          <Wizard title="Connect your calendar" subtitle="Two-way sync keeps SalonFlow and your personal calendar perfectly aligned — no double bookings.">
            <div className="mb-5 grid grid-cols-3 gap-2">
              {["Google", "Microsoft 365", "Apple"].map((p) => (
                <div key={p} className="rounded-lg border border-[#e6e7e7] px-3 py-4 text-center text-[13px] font-medium text-[#3f4544]">{p}</div>
              ))}
            </div>
            <p className="mb-4 text-[12px] text-[#9fa5a4]">In production this launches OAuth (see docs/salonflow/02 §5). For the demo we&apos;ll mark it connected.</p>
            <Primary onClick={connectCalendar}>Connect &amp; continue <ChevronRight className="size-4" /></Primary>
          </Wizard>
        )}

        {step === 5 && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[#dcefd8]"><Sparkles className="size-6 text-[#4F9A57]" /></div>
            <h2 className="font-heading text-[20px] font-semibold">You&apos;re live, {name}! 🎉</h2>
            <p className="mt-1 text-[13px] text-[#6b7280]">Setup took a couple of minutes. Share your booking link and start taking appointments.</p>
            <div className="mx-auto mt-4 flex max-w-sm items-center gap-2 rounded-lg border border-[#e6e7e7] bg-[#f8f9f9] px-3 py-2 text-[13px]">
              <span className="flex-1 truncate text-[#3f4544]">salonflow.app/{state.settings.name.toLowerCase().replace(/\s+/g, "")}</span>
              <Copy className="size-4 text-[#9fa5a4]" />
            </div>
            <div className="mt-5 flex justify-center gap-2">
              <Link href="/salonflow/dashboard" className="rounded-lg bg-[#1f2a4d] px-4 py-2 text-[13px] font-medium text-white">Go to dashboard</Link>
              <Link href="/salonflow/book" className="rounded-lg border border-[#e6e7e7] px-4 py-2 text-[13px] font-medium">Try a test booking</Link>
            </div>
          </div>
        )}

        {step >= 1 && step <= 4 && (
          <button onClick={step === 4 ? goLive : undefined} className="mt-4 w-full text-center text-[12px] text-[#9fa5a4] hover:text-[#6b7280]">
            {step === 4 ? "Skip — finish setup" : ""}
          </button>
        )}
      </div>
    </div>
  );
}

function Wizard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-heading text-[18px] font-semibold">{title}</h2>
      <p className="mb-5 mt-1 text-[13px] text-[#6b7280]">{subtitle}</p>
      {children}
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[12px] font-medium text-[#6b7280]">{children}</span>;
}
function Primary({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1f2a4d] py-3 text-[14px] font-semibold text-white hover:bg-[#28356180] disabled:opacity-40">
      {children}
    </button>
  );
}

function AddQuickService({ onAdd, currency }: { onAdd: (s: Service) => void; currency: string }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(60);
  const [added, setAdded] = useState(false);
  return (
    <div className="mb-5 rounded-lg border border-dashed border-[#d6d8d8] p-3">
      <div className="mb-2 text-[12px] font-medium text-[#6b7280]">Add another service</div>
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gel Manicure" className="flex-1 rounded-lg border border-[#e6e7e7] px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-[#dfe1e1]" />
        <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-20 rounded-lg border border-[#e6e7e7] px-2 py-1.5 text-[13px] outline-none" />
        <button
          disabled={!name}
          onClick={() => { onAdd({ id: `svc-${Date.now()}`, name, category: "custom", durationMin: 45, priceMinor: price * 100, depositMinor: null, bookableOnline: true }); setName(""); setAdded(true); }}
          className="rounded-lg bg-[#2c2f2e] px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {added && <p className="mt-1.5 text-[12px] text-[#4F9A57]">Added — saved to your catalog ({currency}).</p>}
    </div>
  );
}
