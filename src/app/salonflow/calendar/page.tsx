"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  UserX,
  X,
} from "lucide-react";
import { useSalon } from "../lib/store";
import {
  CATEGORY_STYLES,
  DAY_END,
  DAY_START,
  DAYS,
  HOUR_HEIGHT,
  fmtRange,
  money,
  type Appointment,
} from "../lib/types";

const HOURS = Array.from({ length: Math.floor(DAY_END - DAY_START) + 1 }, (_, i) => DAY_START + i);
const GRID_HEIGHT = (DAY_END - DAY_START) * HOUR_HEIGHT;

export default function CalendarPage() {
  const { state, serviceById, clientById, staffById, setStatus } = useSalon();
  const [view, setView] = useState<"day" | "week">("week");
  const [selectedId, setSelectedId] = useState<string | null>("ap-4");

  const visibleDays = view === "week" ? DAYS : DAYS.slice(0, 1);
  const selected = state.appointments.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        {/* toolbar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e6e7e7] px-5">
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-[#e1e2e2] px-3.5 py-1.5 text-[13px] font-semibold hover:bg-[#f4f5f4]">
              TODAY
            </button>
            <div className="flex items-center gap-0.5 text-[#6b7280]">
              <button className="grid size-7 place-items-center rounded-md hover:bg-[#f4f5f4]"><ChevronLeft className="size-4" /></button>
              <button className="grid size-7 place-items-center rounded-md hover:bg-[#f4f5f4]"><ChevronRight className="size-4" /></button>
            </div>
            <button className="flex items-center gap-1.5 text-[15px] font-semibold">
              August 2025 <ChevronDown className="size-4 text-[#9fa5a4]" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/salonflow/book" className="flex items-center gap-1.5 rounded-lg bg-[#1f2a4d] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#28356180]">
              <Plus className="size-4" /> New booking
            </Link>
            <div className="flex items-center rounded-lg bg-[#f0f1f1] p-0.5 text-[13px] font-medium">
              {(["day", "week"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-4 py-1 capitalize ${view === v ? "bg-[#2c2f2e] text-white" : "text-[#6b7280]"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* grid */}
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="sticky top-0 z-10 flex border-b border-[#e6e9ee] bg-white">
            <div className="w-14 shrink-0" />
            {visibleDays.map((d, i) => (
              <div key={d.label} className={`flex-1 border-l border-[#eef0f2] px-3 py-2.5 ${i === 0 ? "border-t-2 border-t-[#5b6bb0]" : ""}`}>
                <div className="text-[11px] font-medium uppercase tracking-wide text-[#9fa5a4]">{d.label}</div>
                <div className="text-[22px] font-semibold leading-tight text-[#2c2f2e]">{d.date}</div>
              </div>
            ))}
          </div>

          <div className="flex" style={{ height: GRID_HEIGHT }}>
            <div className="w-14 shrink-0">
              {HOURS.slice(0, -1).map((h) => {
                const hour = Math.floor(h);
                const period = hour >= 12 ? "PM" : "AM";
                const display = hour % 12 === 0 ? 12 : hour % 12;
                return (
                  <div key={h} className="relative pr-2 text-right" style={{ height: HOUR_HEIGHT }}>
                    <span className="absolute -top-2 right-2 text-[11px] font-medium text-[#9fa5a4]">{display} {period}</span>
                  </div>
                );
              })}
            </div>
            {visibleDays.map((d, dayIndex) => (
              <div key={d.label} className="relative flex-1 border-l border-[#eef0f2]">
                {HOURS.slice(1).map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-[#eef0f2]" style={{ top: (h - DAY_START) * HOUR_HEIGHT }} />
                ))}
                {state.appointments
                  .filter((a) => a.day === dayIndex && a.status !== "cancelled")
                  .map((appt) => (
                    <Card key={appt.id} appt={appt} selected={appt.id === selectedId} onSelect={setSelectedId} serviceName={serviceById(appt.serviceId)?.name ?? ""} clientName={clientById(appt.clientId)?.firstName + " " + (clientById(appt.clientId)?.lastName ?? "")} category={serviceById(appt.serviceId)?.category ?? "custom"} />
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Checkout appointment={selected} onClose={() => setSelectedId(null)} onStatus={setStatus} />
    </div>
  );
}

function Card({
  appt,
  selected,
  onSelect,
  serviceName,
  clientName,
  category,
}: {
  appt: Appointment;
  selected: boolean;
  onSelect: (id: string) => void;
  serviceName: string;
  clientName: string;
  category: keyof typeof CATEGORY_STYLES;
}) {
  const style = CATEGORY_STYLES[category];
  const top = (appt.start - DAY_START) * HOUR_HEIGHT;
  const height = (appt.end - appt.start) * HOUR_HEIGHT;
  const compact = height < 44;
  const done = appt.status === "completed";
  return (
    <button
      onClick={() => onSelect(appt.id)}
      style={{
        top: top + 1,
        height: height - 2,
        backgroundColor: style.fill,
        boxShadow: selected ? `0 0 0 2px ${style.accent}` : undefined,
        opacity: done ? 0.55 : 1,
      }}
      className="absolute inset-x-1 overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left transition-shadow hover:shadow-md"
    >
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: style.accent }} />
      <div className="truncate text-[10px] font-semibold uppercase tracking-wide" style={{ color: style.accent }}>{serviceName}</div>
      {!compact && <div className="truncate text-[12px] font-semibold" style={{ color: style.text }}>{clientName}</div>}
      <div className="mt-0.5 flex items-center gap-1">
        <span className="truncate text-[10px] text-[#6b7280]">{fmtRange(appt.start, appt.end)}</span>
        {appt.isNew && <span className="rounded bg-white/70 px-1 text-[9px] font-bold uppercase text-[#6b7280]">New</span>}
        {appt.source === "ai" && <span className="rounded bg-[#1f2a4d] px-1 text-[9px] font-bold uppercase text-white">AI</span>}
        {appt.starred && <Star className="size-3 fill-[#e6b54a] text-[#e6b54a]" />}
      </div>
    </button>
  );
}

function Checkout({
  appointment,
  onClose,
  onStatus,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  onStatus: (id: string, status: Appointment["status"]) => void;
}) {
  const { serviceById, clientById, staffById, state } = useSalon();
  if (!appointment) {
    return (
      <aside className="hidden w-[340px] shrink-0 flex-col items-center justify-center border-l border-[#e6e7e7] bg-white px-6 text-center md:flex">
        <p className="text-[13px] text-[#9fa5a4]">Select an appointment to view checkout.</p>
      </aside>
    );
  }
  const svc = serviceById(appointment.serviceId);
  const client = clientById(appointment.clientId);
  const staff = staffById(appointment.staffId);
  if (!svc || !client) return null;

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-[#e6e7e7] bg-white">
      <div className="flex items-center justify-between px-5 py-3.5">
        <h2 className="text-[15px] font-semibold">Checkout</h2>
        <button onClick={onClose} className="grid size-7 place-items-center rounded-md text-[#9fa5a4] hover:bg-[#f4f5f4]"><X className="size-4" /></button>
      </div>

      <div className="flex items-center gap-3 px-5 pb-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#cfe4e2] text-sm font-semibold text-[#3f968c]">
          {client.firstName[0]}{client.lastName[0] ?? ""}
        </div>
        <div className="min-w-0 flex-1">
          <Link href="/salonflow/clients" className="text-[14px] font-semibold hover:underline">{client.firstName} {client.lastName}</Link>
          <div className="text-[12px] text-[#9fa5a4]">Client since {new Date(client.since).toLocaleDateString("en", { month: "long", year: "numeric" })}</div>
        </div>
      </div>

      {client.tags.includes("Friends & Family") && (
        <div className="mx-5 mb-4 rounded-lg bg-[#fdf3d4] px-3 py-2.5 text-[13px] font-medium text-[#8a6d2f]">Gets Friends &amp; Family discount</div>
      )}

      <div className="border-y border-[#eef0f2] px-5 py-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[14px] font-semibold">{svc.name}</span>
          <span className="text-[14px] font-semibold">{money(svc.priceMinor, state.settings.currency)}</span>
        </div>
        <div className="text-[12px] text-[#9fa5a4]">with {staff?.name ?? "—"} · {fmtRange(appointment.start, appointment.end)}</div>
      </div>

      <div className="flex-1 px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9fa5a4]">Status</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusPill label="Booked" active={appointment.status === "booked"} onClick={() => onStatus(appointment.id, "booked")} />
          <StatusPill label="Confirmed" active={appointment.status === "confirmed"} onClick={() => onStatus(appointment.id, "confirmed")} />
          <StatusPill label="Completed" active={appointment.status === "completed"} onClick={() => onStatus(appointment.id, "completed")} icon={Check} />
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => onStatus(appointment.id, "no_show")} className="flex items-center gap-1.5 rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px] font-medium text-[#6b7280] hover:bg-[#f4f5f4]">
            <UserX className="size-4" /> No-show
          </button>
          <button onClick={() => onStatus(appointment.id, "cancelled")} className="flex items-center gap-1.5 rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px] font-medium text-[#d06277] hover:bg-[#fdf0f2]">
            <X className="size-4" /> Cancel
          </button>
        </div>
      </div>

      <div className="border-t border-[#eef0f2] p-4">
        <div className="mb-3 flex items-center justify-between text-[14px]">
          <span className="font-semibold">Total due</span>
          <span className="font-semibold">{money(svc.priceMinor, state.settings.currency)}</span>
        </div>
        <button className="w-full rounded-lg bg-[#1f2a4d] py-3 text-[14px] font-semibold tracking-wide text-white hover:bg-[#28356180]">
          GO TO PAYMENTS
        </button>
      </div>
    </aside>
  );
}

function StatusPill({ label, active, onClick, icon: Icon }: { label: string; active: boolean; onClick: () => void; icon?: typeof Check }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium ${active ? "bg-[#2c2f2e] text-white" : "bg-[#f0f1f1] text-[#6b7280] hover:bg-[#e6e7e7]"}`}>
      {Icon && <Icon className="size-3.5" />} {label}
    </button>
  );
}
