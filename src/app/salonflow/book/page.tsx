"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft } from "lucide-react";
import { useSalon } from "../lib/store";
import {
  CATEGORY_STYLES,
  DAY_END,
  DAY_START,
  DAYS,
  fmtRange,
  money,
  type Service,
  type Staff,
} from "../lib/types";

type Step = 1 | 2 | 3 | 4 | 5;

export default function BookPage() {
  const { state, book } = useSalon();
  const [step, setStep] = useState<Step>(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [day, setDay] = useState<number>(0);
  const [start, setStart] = useState<number | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ ok: boolean; reason?: string } | null>(null);

  const service = state.services.find((s) => s.id === serviceId) ?? null;
  const eligibleStaff = useMemo(
    () => state.staff.filter((m) => m.bookableOnline && (!serviceId || m.serviceIds.includes(serviceId))),
    [state.staff, serviceId],
  );

  const slots = useMemo(() => {
    if (!service || !staffId) return [];
    const dur = service.durationMin / 60;
    const taken = state.appointments.filter((a) => a.staffId === staffId && a.day === day && a.status !== "cancelled");
    const out: number[] = [];
    for (let t = DAY_START; t + dur <= DAY_END; t += 0.5) {
      const end = t + dur;
      const clash = taken.some((a) => t < a.end && a.start < end);
      if (!clash) out.push(t);
    }
    return out;
  }, [service, staffId, day, state.appointments]);

  function submit() {
    if (!serviceId || !staffId || start == null || !clientId) return;
    const res = book({ serviceId, staffId, clientId, day, start, source: "online" });
    setConfirmed(res.ok ? { ok: true } : { ok: false, reason: res.reason });
    setStep(5);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="rounded-2xl border border-[#e6e7e7] bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="font-heading text-[18px] font-semibold">Book at {state.settings.name}</h1>
          {step > 1 && step < 5 && (
            <button onClick={() => setStep((s) => (s - 1) as Step)} className="flex items-center gap-1 text-[13px] text-[#6b7280] hover:text-[#2c2f2e]">
              <ChevronLeft className="size-4" /> Back
            </button>
          )}
        </div>
        {step < 5 && <Progress step={step} />}

        {step === 1 && (
          <Section title="Choose a service">
            {state.services.filter((s) => s.bookableOnline).map((svc) => (
              <ServiceRow key={svc.id} svc={svc} selected={serviceId === svc.id} onClick={() => { setServiceId(svc.id); setStaffId(null); setStart(null); setStep(2); }} currency={state.settings.currency} />
            ))}
          </Section>
        )}

        {step === 2 && (
          <Section title="Choose your specialist">
            {eligibleStaff.map((m) => (
              <StaffRow key={m.id} staff={m} selected={staffId === m.id} onClick={() => { setStaffId(m.id); setStart(null); setStep(3); }} />
            ))}
          </Section>
        )}

        {step === 3 && (
          <Section title="Choose a day">
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map((d, i) => (
                <button key={d.label} onClick={() => { setDay(i); setStart(null); setStep(4); }} className={`rounded-lg border px-2 py-3 text-center ${day === i ? "border-[#1f2a4d] bg-[#f4f6fb]" : "border-[#e6e7e7] hover:bg-[#f8f9f9]"}`}>
                  <div className="text-[11px] uppercase text-[#9fa5a4]">{d.label}</div>
                  <div className="text-[18px] font-semibold">{d.date}</div>
                </button>
              ))}
            </div>
          </Section>
        )}

        {step === 4 && (
          <Section title="Choose a time">
            {slots.length === 0 ? (
              <p className="text-[13px] text-[#9fa5a4]">No free slots that day — try another day.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((t) => (
                  <button key={t} onClick={() => setStart(t)} className={`rounded-lg border px-2 py-2 text-[13px] ${start === t ? "border-[#1f2a4d] bg-[#1f2a4d] text-white" : "border-[#e6e7e7] hover:bg-[#f8f9f9]"}`}>
                    {fmtRange(t, t).split(" - ")[0]}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4">
              <span className="mb-1.5 block text-[13px] font-medium text-[#6b7280]">Who is this for?</span>
              <select value={clientId ?? ""} onChange={(e) => setClientId(e.target.value || null)} className="w-full rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#dfe1e1]">
                <option value="">Select a client…</option>
                {state.clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            {service?.depositMinor && (
              <div className="mt-3 rounded-lg bg-[#f6f8fc] px-3 py-2.5 text-[13px] text-[#3f4544]">
                A {money(service.depositMinor, state.settings.currency)} deposit secures your spot (demo — no real charge).
              </div>
            )}
            <button disabled={start == null || !clientId} onClick={submit} className="mt-4 w-full rounded-lg bg-[#1f2a4d] py-3 text-[14px] font-semibold text-white disabled:opacity-40">
              Confirm booking
            </button>
          </Section>
        )}

        {step === 5 && confirmed && (
          <div className="py-6 text-center">
            {confirmed.ok ? (
              <>
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[#dcefd8]"><Check className="size-6 text-[#4F9A57]" /></div>
                <h2 className="text-[18px] font-semibold">You're booked!</h2>
                <p className="mt-1 text-[13px] text-[#6b7280]">{service?.name} with {state.staff.find((s) => s.id === staffId)?.name} · {DAYS[day].label} {DAYS[day].date}, {start != null && fmtRange(start, start).split(" - ")[0]}</p>
                <p className="mt-1 text-[12px] text-[#9fa5a4]">A confirmation would be sent by SMS &amp; email. It now appears on the calendar.</p>
                <div className="mt-5 flex justify-center gap-2">
                  <Link href="/salonflow/calendar" className="rounded-lg bg-[#1f2a4d] px-4 py-2 text-[13px] font-medium text-white">View on calendar</Link>
                  <button onClick={() => { setStep(1); setServiceId(null); setStaffId(null); setStart(null); setClientId(null); setConfirmed(null); }} className="rounded-lg border border-[#e6e7e7] px-4 py-2 text-[13px] font-medium">Book another</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-[18px] font-semibold text-[#d06277]">Couldn't book</h2>
                <p className="mt-1 text-[13px] text-[#6b7280]">{confirmed.reason}</p>
                <button onClick={() => setStep(4)} className="mt-4 rounded-lg bg-[#1f2a4d] px-4 py-2 text-[13px] font-medium text-white">Pick another time</button>
              </>
            )}
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-[12px] text-[#9fa5a4]">Demo booking page · the same flow powers the future marketplace.</p>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  const labels = ["Service", "Staff", "Day", "Time"];
  return (
    <div className="mb-5 mt-3 flex items-center gap-1.5">
      {labels.map((l, i) => (
        <div key={l} className="flex flex-1 items-center gap-1.5">
          <div className={`h-1 flex-1 rounded-full ${i < step ? "bg-[#1f2a4d]" : "bg-[#e6e7e7]"}`} />
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 mt-2 text-[15px] font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ServiceRow({ svc, selected, onClick, currency }: { svc: Service; selected: boolean; onClick: () => void; currency: string }) {
  const style = CATEGORY_STYLES[svc.category];
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left ${selected ? "border-[#1f2a4d]" : "border-[#e6e7e7] hover:bg-[#f8f9f9]"}`}>
      <span className="size-3 rounded-full" style={{ backgroundColor: style.accent }} />
      <div className="flex-1">
        <div className="text-[14px] font-medium">{svc.name}</div>
        <div className="text-[12px] text-[#9fa5a4]">{svc.durationMin} min</div>
      </div>
      <span className="text-[14px] font-semibold">{money(svc.priceMinor, currency)}</span>
    </button>
  );
}

function StaffRow({ staff, selected, onClick }: { staff: Staff; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left ${selected ? "border-[#1f2a4d]" : "border-[#e6e7e7] hover:bg-[#f8f9f9]"}`}>
      <span className="grid size-9 place-items-center rounded-full text-[12px] font-semibold text-white" style={{ backgroundColor: staff.color }}>{staff.initials}</span>
      <div className="flex-1">
        <div className="text-[14px] font-medium">{staff.name}</div>
        <div className="text-[12px] text-[#9fa5a4] capitalize">{staff.role}</div>
      </div>
    </button>
  );
}
