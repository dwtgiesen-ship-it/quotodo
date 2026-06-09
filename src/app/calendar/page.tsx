"use client";

import { useState } from "react";
import {
  BarChart3,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LayoutGrid,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Search,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Users,
} from "lucide-react";

import {
  APPOINTMENTS,
  CATEGORY_STYLES,
  CHECKOUT,
  DAY_END,
  DAY_START,
  DAYS,
  HOUR_HEIGHT,
  SELECTED_APPT_ID,
  SERVICE_MENU,
  type Appointment,
} from "./data";

const NAV_ITEMS = [
  { label: "Get Started", icon: Sparkles },
  { label: "Calendar", icon: CalendarIcon, active: true },
  { label: "Clients", icon: Users },
  { label: "Sales", icon: Tag },
  { label: "Messages", icon: MessageSquare },
  { label: "Reports", icon: BarChart3 },
];

function formatHour(h: number) {
  const hour = Math.floor(h);
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return { display, period };
}

function formatRange(start: number, end: number) {
  const fmt = (h: number) => {
    const hour = Math.floor(h);
    const min = Math.round((h - hour) * 60);
    const display = hour % 12 === 0 ? 12 : hour % 12;
    const mm = min === 0 ? "00" : String(min).padStart(2, "0");
    return `${display}:${mm}`;
  };
  const endPeriod = end >= 12 ? "PM" : "AM";
  return `${fmt(start)} - ${fmt(end)} ${endPeriod}`;
}

const HOURS = Array.from(
  { length: Math.floor(DAY_END - DAY_START) + 1 },
  (_, i) => DAY_START + i,
);
const GRID_HEIGHT = (DAY_END - DAY_START) * HOUR_HEIGHT;

export default function CalendarPage() {
  const [view, setView] = useState<"day" | "week">("week");
  const [selectedId, setSelectedId] = useState(SELECTED_APPT_ID);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f4f5f4] text-[#2c2f2e]">
      <TopNav />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <Toolbar view={view} setView={setView} />
          <CalendarGrid selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <CheckoutPanel />
      </div>
    </div>
  );
}

function TopNav() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-[#1f2a4d] px-4 text-white/90">
      <div className="flex items-center gap-1">
        <div className="mr-3 grid size-8 place-items-center rounded-md bg-gradient-to-br from-[#f0a8c0] to-[#9a7bd6] text-sm font-bold text-white">
          P
        </div>
        <nav className="flex items-center">
          {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-1.5">
        <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-white/70 hover:text-white">
          <LayoutGrid className="size-4" strokeWidth={1.75} />
          Apps
        </button>
        <button className="grid size-8 place-items-center rounded-md text-white/70 hover:text-white">
          <MessageCircle className="size-[18px]" strokeWidth={1.75} />
        </button>
        <div className="ml-1 flex items-center gap-2 pl-1">
          <div className="grid size-8 place-items-center rounded-full bg-[#5b6bb0] text-xs font-semibold text-white">
            LB
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-white">Liam Basil</div>
            <div className="text-[11px] text-white/60">Pearly</div>
          </div>
          <ChevronDown className="size-4 text-white/60" />
        </div>
      </div>
    </header>
  );
}

function Toolbar({
  view,
  setView,
}: {
  view: "day" | "week";
  setView: (v: "day" | "week") => void;
}) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e6e7e7] bg-white px-5">
      <div className="flex items-center gap-3">
        <button className="rounded-full border border-[#e1e2e2] px-3.5 py-1.5 text-[13px] font-semibold text-[#2c2f2e] hover:bg-[#f4f5f4]">
          TODAY
        </button>
        <div className="flex items-center gap-0.5 text-[#6b7280]">
          <button className="grid size-7 place-items-center rounded-md hover:bg-[#f4f5f4]">
            <ChevronLeft className="size-4" />
          </button>
          <button className="grid size-7 place-items-center rounded-md hover:bg-[#f4f5f4]">
            <ChevronRight className="size-4" />
          </button>
        </div>
        <button className="flex items-center gap-1.5 text-[15px] font-semibold text-[#2c2f2e]">
          August 2025
          <ChevronDown className="size-4 text-[#9fa5a4]" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-[#4b5563] hover:bg-[#f4f5f4]">
          Andre
          <ChevronDown className="size-4 text-[#9fa5a4]" />
        </button>
        <div className="flex items-center rounded-lg bg-[#f0f1f1] p-0.5 text-[13px] font-medium">
          {(["day", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-4 py-1 capitalize transition-colors ${
                view === v
                  ? "bg-[#2c2f2e] text-white"
                  : "text-[#6b7280] hover:text-[#2c2f2e]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarGrid({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-white">
      {/* Day headers */}
      <div className="sticky top-0 z-10 flex border-b border-[#e6e9ee] bg-white">
        <div className="w-14 shrink-0" />
        {DAYS.map((d, i) => (
          <div
            key={d.label}
            className={`flex-1 border-l border-[#eef0f2] px-3 py-2.5 ${
              i === 0 ? "border-t-2 border-t-[#5b6bb0]" : ""
            }`}
          >
            <div className="text-[11px] font-medium uppercase tracking-wide text-[#9fa5a4]">
              {d.label}
            </div>
            <div
              className={`text-[22px] font-semibold leading-tight ${
                i === 0 ? "text-[#2c2f2e]" : "text-[#3f4544]"
              }`}
            >
              {d.date}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex" style={{ height: GRID_HEIGHT }}>
        {/* Time gutter */}
        <div className="w-14 shrink-0">
          {HOURS.slice(0, -1).map((h) => {
            const { display, period } = formatHour(h);
            return (
              <div
                key={h}
                className="relative pr-2 text-right"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2 right-2 text-[11px] font-medium text-[#9fa5a4]">
                  {display} {period}
                </span>
              </div>
            );
          })}
        </div>

        {/* Day columns */}
        {DAYS.map((d, dayIndex) => (
          <div
            key={d.label}
            className="relative flex-1 border-l border-[#eef0f2]"
          >
            {/* hour lines */}
            {HOURS.slice(1).map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-[#eef0f2]"
                style={{ top: (h - DAY_START) * HOUR_HEIGHT }}
              />
            ))}
            {APPOINTMENTS.filter((a) => a.day === dayIndex).map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                selected={appt.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AppointmentCard({
  appt,
  selected,
  onSelect,
}: {
  appt: Appointment;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const style = CATEGORY_STYLES[appt.category];
  const top = (appt.start - DAY_START) * HOUR_HEIGHT;
  const height = (appt.end - appt.start) * HOUR_HEIGHT;
  const isBreak = appt.category === "break";
  const compact = height < 46;

  return (
    <button
      onClick={() => onSelect(appt.id)}
      style={{
        top: top + 1,
        height: height - 2,
        backgroundColor: isBreak ? undefined : style.fill,
        backgroundImage: isBreak
          ? "repeating-linear-gradient(45deg, #e3e3e3 0, #e3e3e3 5px, #f1f1f1 5px, #f1f1f1 10px)"
          : undefined,
        boxShadow: selected ? `0 0 0 2px ${style.accent}` : undefined,
      }}
      className="absolute inset-x-1 overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left transition-shadow hover:shadow-md"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: style.accent }}
      />
      <div
        className="truncate text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: style.accent }}
      >
        {appt.service}
      </div>
      {!compact && appt.client && (
        <div
          className="truncate text-[12px] font-semibold"
          style={{ color: style.text }}
        >
          {appt.client}
        </div>
      )}
      <div className="mt-0.5 flex items-center gap-1">
        <span className="truncate text-[10px] text-[#6b7280]">
          {formatRange(appt.start, appt.end)}
        </span>
        {appt.isNew && (
          <span className="rounded bg-white/70 px-1 text-[9px] font-bold uppercase text-[#6b7280]">
            New
          </span>
        )}
        {appt.starred && (
          <Star className="size-3 fill-[#e6b54a] text-[#e6b54a]" />
        )}
      </div>
    </button>
  );
}

function CheckoutPanel() {
  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-[#e6e7e7] bg-white">
      <div className="flex items-center justify-between px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-[#2c2f2e]">Checkout</h2>
        <button className="grid size-7 place-items-center rounded-md text-[#9fa5a4] hover:bg-[#f4f5f4]">
          <MoreHorizontal className="size-5" />
        </button>
      </div>

      {/* Client */}
      <div className="flex items-center gap-3 px-5 pb-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#cfe4e2] text-sm font-semibold text-[#3f968c]">
          {CHECKOUT.client.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[#2c2f2e]">
            {CHECKOUT.client.name}
          </div>
          <div className="text-[12px] text-[#9fa5a4]">{CHECKOUT.client.since}</div>
        </div>
        <button className="grid size-7 place-items-center rounded-md text-[#9fa5a4] hover:bg-[#f4f5f4]">
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* Discount banner */}
      <div className="mx-5 mb-4 rounded-lg bg-[#fdf3d4] px-3 py-2.5 text-[13px] font-medium text-[#8a6d2f]">
        {CHECKOUT.discount}
      </div>

      {/* Cart items */}
      <div className="border-t border-[#eef0f2]">
        {CHECKOUT.cart.map((item) => (
          <div
            key={item.service}
            className="flex items-start gap-2 border-b border-[#eef0f2] px-5 py-3"
          >
            <ChevronUp className="mt-0.5 size-4 shrink-0 text-[#c2c6c5]" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[14px] font-semibold text-[#2c2f2e]">
                  {item.service}
                </span>
                <span className="text-[14px] font-semibold text-[#2c2f2e]">
                  ${item.price.toFixed(2)}
                </span>
              </div>
              <div className="text-[12px] text-[#9fa5a4]">{item.provider}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + service menu */}
      <div className="min-h-0 flex-1 overflow-auto px-5 pt-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9fa5a4]" />
          <input
            placeholder="Search ..."
            className="w-full rounded-lg bg-[#f4f5f4] py-2 pl-9 pr-3 text-[13px] text-[#2c2f2e] outline-none placeholder:text-[#9fa5a4] focus:ring-2 focus:ring-[#dfe1e1]"
          />
        </div>

        {SERVICE_MENU.map((group) => (
          <div key={group.section} className="mb-4">
            <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#9fa5a4]">
              {group.section}
            </div>
            <div className="space-y-0.5">
              {group.items.map((svc) => {
                const highlighted = svc.name === CHECKOUT.highlightedService;
                return (
                  <button
                    key={svc.name}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                      highlighted
                        ? "bg-[#eaf1f0] font-medium"
                        : "hover:bg-[#f4f5f4]"
                    }`}
                  >
                    <span className="text-[#2c2f2e]">{svc.name}</span>
                    <span className="text-[#9fa5a4]">${svc.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-[#eef0f2] p-4">
        <button className="w-full rounded-lg bg-[#1f2a4d] py-3 text-[14px] font-semibold tracking-wide text-white transition-colors hover:bg-[#28356180]">
          GO TO PAYMENTS
        </button>
      </div>
    </aside>
  );
}
