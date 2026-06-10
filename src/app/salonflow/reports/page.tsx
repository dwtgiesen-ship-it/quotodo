"use client";

import { useMemo } from "react";
import { Download, TrendingUp } from "lucide-react";
import { useSalon } from "../lib/store";
import { useRole, Restricted } from "../components/role";
import { CATEGORY_STYLES, DAYS, money } from "../lib/types";

export default function ReportsPage() {
  const { can } = useRole();
  const { state, serviceById, staffById, clientById } = useSalon();

  const m = useMemo(() => {
    const all = state.appointments;
    const active = all.filter((a) => a.status !== "cancelled");
    const price = (id: string) => serviceById(id)?.priceMinor ?? 0;
    const revenue = active.reduce((s, a) => s + price(a.serviceId), 0);
    const completed = all.filter((a) => a.status === "completed").length;
    const noShows = all.filter((a) => a.status === "no_show").length;
    const cancelled = all.filter((a) => a.status === "cancelled").length;
    const noShowRate = all.length ? (noShows / all.length) * 100 : 0;

    const perDay = DAYS.map((d, i) => ({ label: d.label, value: active.filter((a) => a.day === i).reduce((s, a) => s + price(a.serviceId), 0) }));

    const svcMap = new Map<string, { count: number; rev: number }>();
    active.forEach((a) => { const c = svcMap.get(a.serviceId) ?? { count: 0, rev: 0 }; c.count++; c.rev += price(a.serviceId); svcMap.set(a.serviceId, c); });
    const topServices = [...svcMap.entries()].map(([id, v]) => ({ service: serviceById(id), ...v })).filter((x) => x.service).sort((a, b) => b.rev - a.rev);

    const staffPerf = state.staff.map((st) => {
      const appts = active.filter((a) => a.staffId === st.id);
      return { staff: st, count: appts.length, rev: appts.reduce((s, a) => s + price(a.serviceId), 0) };
    }).sort((a, b) => b.rev - a.rev);

    // retention: clients with 2+ appointments / clients with 1+
    const byClient = new Map<string, number>();
    all.forEach((a) => byClient.set(a.clientId, (byClient.get(a.clientId) ?? 0) + 1));
    const withAny = byClient.size;
    const returning = [...byClient.values()].filter((n) => n >= 2).length;
    const retention = withAny ? (returning / withAny) * 100 : 0;

    const clv = state.clients.length ? state.clients.reduce((s, c) => s + c.totalSpendMinor, 0) / state.clients.length : 0;

    const sources = { online: active.filter((a) => a.source === "online").length, dashboard: active.filter((a) => a.source === "dashboard").length, ai: active.filter((a) => a.source === "ai").length };

    return { revenue, bookings: active.length, completed, noShows, cancelled, noShowRate, perDay, topServices, staffPerf, retention, clv, returning, sources };
  }, [state, serviceById]);

  if (!can("reports")) return <Restricted />;

  const maxDay = Math.max(...m.perDay.map((d) => d.value), 1);
  const maxSvc = Math.max(...m.topServices.map((s) => s.rev), 1);

  function exportCsv() {
    const rows = [["Day", "Start", "End", "Service", "Staff", "Client", "Status", "Source", "Price"]];
    state.appointments.forEach((a) => {
      rows.push([
        DAYS[a.day]?.label ?? String(a.day), String(a.start), String(a.end),
        serviceById(a.serviceId)?.name ?? "", staffById(a.staffId)?.name ?? "",
        `${clientById(a.clientId)?.firstName ?? ""} ${clientById(a.clientId)?.lastName ?? ""}`.trim(),
        a.status, a.source, ((serviceById(a.serviceId)?.priceMinor ?? 0) / 100).toFixed(2),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "salonflow-appointments.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[22px] font-semibold tracking-tight">Reports</h1>
          <p className="text-[13px] text-sf-muted">This week · {state.settings.name}</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-lg border border-sf-line bg-sf-card px-3.5 py-2 text-[13px] font-medium hover:bg-sf-soft"><Download className="size-4" /> Export CSV</button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Revenue" value={money(m.revenue, state.settings.currency)} sub="+12%" />
        <Kpi label="Bookings" value={String(m.bookings)} sub={`${m.completed} completed`} />
        <Kpi label="No-show rate" value={`${m.noShowRate.toFixed(0)}%`} sub={`${m.noShows} no-shows`} />
        <Kpi label="Retention" value={`${m.retention.toFixed(0)}%`} sub={`${m.returning} returning`} />
        <Kpi label="Avg CLV" value={money(m.clv, state.settings.currency)} sub="lifetime value" />
        <Kpi label="Cancellations" value={String(m.cancelled)} sub="this week" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Revenue by day">
          <div className="flex h-44 items-end gap-2 pt-2">
            {m.perDay.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[11px] font-medium text-sf-ink2">{d.value ? money(d.value) : ""}</span>
                <div className="w-full rounded-t-md bg-[#5777B0]" style={{ height: Math.max(d.value ? 6 : 2, Math.round((d.value / maxDay) * 130)), opacity: d.value ? 1 : 0.25 }} />
                <span className="text-[11px] text-sf-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Revenue by service">
          <div className="space-y-2.5 pt-1">
            {m.topServices.map(({ service, rev, count }) => (
              <div key={service!.id} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-[13px]">{service!.name}</span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-sf-soft"><div className="h-full rounded" style={{ width: `${(rev / maxSvc) * 100}%`, backgroundColor: CATEGORY_STYLES[service!.category].accent }} /></div>
                <span className="w-20 text-right text-[12px] font-medium text-sf-ink2">{money(rev, state.settings.currency)} ({count})</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Staff performance">
          <table className="w-full text-[13px]"><tbody>
            {m.staffPerf.map(({ staff, count, rev }) => (
              <tr key={staff.id} className="border-b border-sf-line last:border-0">
                <td className="py-2"><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: staff.color }}>{staff.initials}</span>{staff.name}</div></td>
                <td className="py-2 text-right text-sf-ink2">{count} appts</td>
                <td className="py-2 text-right font-medium">{money(rev, state.settings.currency)}</td>
              </tr>
            ))}
          </tbody></table>
        </Card>

        <Card title="Booking channels">
          <div className="space-y-2.5 pt-1">
            {([["Online", m.sources.online, "#4F9A57"], ["Front desk", m.sources.dashboard, "#5777B0"], ["AI assistant", m.sources.ai, "#8B5FB8"]] as const).map(([label, n, color]) => {
              const total = m.sources.online + m.sources.dashboard + m.sources.ai || 1;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[13px]">{label}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-sf-soft"><div className="h-full rounded" style={{ width: `${(n / total) * 100}%`, backgroundColor: color }} /></div>
                  <span className="w-10 text-right text-[12px] font-medium text-sf-ink2">{n}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-sf-line bg-sf-card p-3.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-sf-muted">{label}</div>
      <div className="mt-1 text-[20px] font-semibold leading-tight">{value}</div>
      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-sf-ink2"><TrendingUp className="size-3" /> {sub}</div>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-sf-line bg-sf-card p-4"><div className="mb-1 text-[13px] font-semibold">{title}</div>{children}</div>;
}
