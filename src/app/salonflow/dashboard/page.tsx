"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { ArrowUpRight, Clock, Sparkles, TrendingUp } from "lucide-react";
import { useSalon } from "../lib/store";
import { CATEGORY_STYLES, DAY_END, DAY_START, DAYS, money } from "../lib/types";

export default function DashboardPage() {
  const { state, serviceById, staffById, book, removeWaitlist } = useSalon();
  const { appointments, services, staff, clients, settings } = state;

  function offerWaitlist(entryId: string, clientId: string, serviceId: string, preferDay: number) {
    const svc = serviceById(serviceId);
    if (!svc) return;
    const dur = svc.durationMin / 60;
    const days = preferDay >= 0 ? [preferDay] : DAYS.map((_, i) => i);
    for (const day of days) {
      for (const m of staff.filter((s) => s.serviceIds.includes(serviceId))) {
        const taken = appointments.filter((a) => a.staffId === m.id && a.day === day && a.status !== "cancelled");
        for (let t = DAY_START; t + dur <= DAY_END; t += 0.5) {
          if (!taken.some((a) => t < a.end && a.start < t + dur)) {
            const res = book({ serviceId, staffId: m.id, clientId, day, start: t, source: "ai" });
            if (res.ok) { removeWaitlist(entryId); toast.success(`Booked from waitlist — ${DAYS[day].label} ${DAYS[day].date}`); return; }
          }
        }
      }
    }
    toast.error("No open slot found this week");
  }

  const metrics = useMemo(() => {
    const active = appointments.filter((a) => a.status !== "cancelled");
    const revenue = active.reduce((sum, a) => sum + (serviceById(a.serviceId)?.priceMinor ?? 0), 0);
    const noShows = appointments.filter((a) => a.status === "no_show").length;
    const onlineCount = active.filter((a) => a.source === "online").length;
    const aiCount = active.filter((a) => a.source === "ai").length;

    // revenue per day
    const perDay = DAYS.map((d, i) => ({
      label: d.label,
      value: active
        .filter((a) => a.day === i)
        .reduce((s, a) => s + (serviceById(a.serviceId)?.priceMinor ?? 0), 0),
    }));

    // top services
    const svcCount = new Map<string, number>();
    active.forEach((a) => svcCount.set(a.serviceId, (svcCount.get(a.serviceId) ?? 0) + 1));
    const topServices = [...svcCount.entries()]
      .map(([id, count]) => ({ service: serviceById(id), count }))
      .filter((x) => x.service)
      .sort((a, b) => b.count - a.count);

    // staff performance
    const staffPerf = staff.map((m) => {
      const appts = active.filter((a) => a.staffId === m.id);
      const rev = appts.reduce((s, a) => s + (serviceById(a.serviceId)?.priceMinor ?? 0), 0);
      return { staff: m, count: appts.length, rev };
    }).sort((a, b) => b.rev - a.rev);

    return { revenue, bookings: active.length, noShows, onlineCount, aiCount, perDay, topServices, staffPerf };
  }, [appointments, serviceById, staff]);

  const maxDay = Math.max(...metrics.perDay.map((d) => d.value), 1);
  const maxSvc = Math.max(...metrics.topServices.map((s) => s.count), 1);

  // AI insights derived from data
  const inactive = clients.filter((c) => c.tags.includes("Win-back")).length;
  const emptyDayIdx = metrics.perDay.findIndex((d) => d.value === Math.min(...metrics.perDay.map((x) => x.value)));

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[22px] font-semibold tracking-tight text-[#2c2f2e]">Dashboard</h1>
          <p className="text-[13px] text-[#9fa5a4]">{settings.name} · this week (Aug 13–19, 2025)</p>
        </div>
        <Link
          href="/salonflow/assistant"
          className="flex items-center gap-1.5 rounded-lg bg-[#1f2a4d] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#28356180]"
        >
          <Sparkles className="size-4" />
          Ask the assistant
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Revenue" value={money(metrics.revenue, settings.currency)} trend="+12%" />
        <Kpi label="Bookings" value={String(metrics.bookings)} trend={`${metrics.onlineCount} online`} />
        <Kpi label="No-shows" value={String(metrics.noShows)} trend="0%" good />
        <Kpi label="AI-booked" value={String(metrics.aiCount)} trend="auto-filled" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue trend */}
        <Card title="Revenue by day">
          <div className="flex h-44 items-end gap-2 pt-2">
            {metrics.perDay.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[11px] font-medium text-[#6b7280]">{d.value ? money(d.value) : ""}</span>
                <div
                  className="w-full rounded-t-md bg-[#5777B0] transition-all"
                  style={{ height: Math.max(d.value ? 6 : 2, Math.round((d.value / maxDay) * 130)), opacity: d.value ? 1 : 0.25 }}
                  title={money(d.value)}
                />
                <span className="text-[11px] text-[#9fa5a4]">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top services */}
        <Card title="Top services">
          <div className="space-y-2.5 pt-1">
            {metrics.topServices.map(({ service, count }) => {
              const style = CATEGORY_STYLES[service!.category];
              return (
                <div key={service!.id} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-[13px] text-[#2c2f2e]">{service!.name}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-[#f0f1f1]">
                    <div className="h-full rounded" style={{ width: `${(count / maxSvc) * 100}%`, backgroundColor: style.accent }} />
                  </div>
                  <span className="w-6 text-right text-[12px] font-medium text-[#6b7280]">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Staff performance */}
        <Card title="Staff performance">
          <table className="w-full text-[13px]">
            <tbody>
              {metrics.staffPerf.map(({ staff: m, count, rev }) => (
                <tr key={m.id} className="border-b border-[#f0f1f1] last:border-0">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: m.color }}>
                        {m.initials}
                      </span>
                      <span className="text-[#2c2f2e]">{m.name}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right text-[#6b7280]">{count} appts</td>
                  <td className="py-2 text-right font-medium text-[#2c2f2e]">{money(rev, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* AI insights */}
        <Card title="AI insights" accent>
          <div className="space-y-2.5 pt-1">
            <Insight
              text={`${inactive || 1} client${inactive === 1 ? "" : "s"} haven't booked in 60 days. Send a win-back offer?`}
              action="Run win-back"
            />
            <Insight
              text={`${DAYS[emptyDayIdx]?.label ?? "Sun"} is your quietest day. Promote a slow-day discount?`}
              action="Create promo"
            />
            <Insight
              text="3 cancellations match waitlist entries. Auto-offer the open slots?"
              action="Fill slots"
            />
          </div>
        </Card>

        {/* Waitlist */}
        <Card title="Waitlist">
          {state.waitlist.length === 0 ? (
            <p className="pt-1 text-[13px] text-[#9fa5a4]">No one waiting. Cancellations will surface matches here.</p>
          ) : (
            <div className="space-y-2 pt-1">
              {state.waitlist.map((w) => {
                const client = clients.find((c) => c.id === w.clientId);
                const svc = serviceById(w.serviceId);
                return (
                  <div key={w.id} className="flex items-center justify-between rounded-lg bg-[#f8f9f9] px-3 py-2">
                    <div className="flex items-center gap-2 text-[13px]">
                      <Clock className="size-4 text-[#9fa5a4]" />
                      <span><span className="font-medium">{client?.firstName} {client?.lastName}</span> · {svc?.name} · {w.windowDay >= 0 ? DAYS[w.windowDay].label : "any day"}</span>
                    </div>
                    <button onClick={() => offerWaitlist(w.id, w.clientId, w.serviceId, w.windowDay)} className="rounded-md bg-[#1f2a4d] px-2.5 py-1 text-[12px] font-medium text-white hover:bg-[#28356180]">Book slot</button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, trend, good }: { label: string; value: string; trend: string; good?: boolean }) {
  return (
    <div className="rounded-xl border border-[#e6e7e7] bg-white p-4">
      <div className="text-[12px] font-medium uppercase tracking-wide text-[#9fa5a4]">{label}</div>
      <div className="mt-1 text-[24px] font-semibold leading-tight text-[#2c2f2e]">{value}</div>
      <div className={`mt-1 flex items-center gap-1 text-[12px] ${good ? "text-[#4F9A57]" : "text-[#6b7280]"}`}>
        <TrendingUp className="size-3.5" />
        {trend}
      </div>
    </div>
  );
}

function Card({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-xl border bg-white p-4 ${accent ? "border-[#d8e0f0]" : "border-[#e6e7e7]"}`}>
      <div className="mb-1 text-[13px] font-semibold text-[#2c2f2e]">{title}</div>
      {children}
    </div>
  );
}

function Insight({ text, action }: { text: string; action: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-[#f6f8fc] p-3">
      <p className="text-[13px] leading-snug text-[#3f4544]">{text}</p>
      <button className="flex shrink-0 items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[12px] font-medium text-[#5777B0] shadow-sm hover:bg-[#eef2fb]">
        {action}
        <ArrowUpRight className="size-3.5" />
      </button>
    </div>
  );
}
