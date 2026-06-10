// Live, in-app product mockups for the marketing homepage.
//
// These replace the old static /shots/*.png screenshots. They are built from
// the SAME design tokens as the real dashboard (navy #1f2a4d chrome, card
// borders #e6e7e7, the #5777B0 chart blue, category accent colors) and the
// current <Logo>, so they can never drift from the live app's brand or design.
// Purely decorative: aria-hidden + non-interactive.

import { Sparkles, TrendingUp, ArrowUpRight, Search, CalendarSync, Check } from "lucide-react";
import { Logo } from "@/components/brand/logo";

// shared category accents (mirror CATEGORY_STYLES in the app)
const GREEN = "#4F9A57", PURPLE = "#8B5FB8", RED = "#D06277", BLUE = "#5777B0", TEAL = "#3F968C";

/** Browser frame with a light chrome bar — wraps every product mockup. */
export function Frame({ children, label = "app.schedulemode.com" }: { children: React.ReactNode; label?: string }) {
  return (
    <div aria-hidden className="select-none overflow-hidden rounded-2xl border border-sf-line bg-sf-card shadow-[0_24px_70px_-30px_rgba(31,42,77,0.35)]">
      <div className="flex items-center gap-1.5 border-b border-sf-line bg-sf-bg2 px-3 py-2">
        <span className="size-2.5 rounded-full bg-sf-line" /><span className="size-2.5 rounded-full bg-sf-line" /><span className="size-2.5 rounded-full bg-sf-line" />
        <span className="ml-3 flex-1 truncate rounded-md border border-sf-line bg-sf-card px-2.5 py-0.5 text-[10px] text-sf-muted">{label}</span>
      </div>
      {children}
    </div>
  );
}

/** Mini navy app top-nav, carrying the current brand into every shot. */
function AppChrome({ active }: { active: string }) {
  const items = ["Dashboard", "Calendar", "Clients", "Services", "Reports"];
  return (
    <div className="flex items-center gap-2 bg-sf-navy px-3 py-2">
      <Logo className="size-5" />
      <span className="font-heading text-[11px] font-bold text-white">Schedulemode</span>
      <div className="ml-2 hidden items-center gap-0.5 sm:flex">
        {items.map((it) => (
          <span key={it} className={`rounded px-2 py-1 text-[10px] font-medium ${it === active ? "bg-white/10 text-white" : "text-white/55"}`}>{it}</span>
        ))}
      </div>
      <span className="ml-auto grid size-5 place-items-center rounded-full bg-[#5b6bb0] text-[8px] font-semibold text-white">AP</span>
    </div>
  );
}

function Kpi({ label, value, trend, good }: { label: string; value: string; trend: string; good?: boolean }) {
  return (
    <div className="rounded-lg border border-sf-line bg-sf-card p-2.5">
      <div className="text-[8.5px] font-medium uppercase tracking-wide text-sf-muted">{label}</div>
      <div className="mt-0.5 text-[16px] font-semibold leading-tight text-sf-ink">{value}</div>
      <div className={`mt-0.5 flex items-center gap-0.5 text-[9px] ${good ? "text-[#4F9A57]" : "text-sf-ink2"}`}><TrendingUp className="size-2.5" /> {trend}</div>
    </div>
  );
}

function MiniCard({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-lg border bg-sf-card p-2.5 ${accent ? "border-sf-accent/30" : "border-sf-line"}`}>
      <div className="mb-1.5 text-[10px] font-semibold text-sf-ink">{title}</div>
      {children}
    </div>
  );
}

const REV = [
  { d: "Wed", v: 665 }, { d: "Thu", v: 560 }, { d: "Fri", v: 390 },
  { d: "Sat", v: 0 }, { d: "Sun", v: 0 }, { d: "Mon", v: 190 }, { d: "Tue", v: 0 },
];
const SERVICES = [
  { name: "Express Facial", n: 6, c: GREEN }, { name: "Custom Facial", n: 5, c: PURPLE },
  { name: "Hydra Facial", n: 4, c: RED }, { name: "Signature Facial", n: 4, c: BLUE },
  { name: "Peppermint Body Scrub", n: 1, c: TEAL },
];

export function DashboardMock() {
  const maxDay = 665, maxSvc = 6;
  return (
    <Frame>
      <AppChrome active="Dashboard" />
      <div className="bg-sf-card p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <div className="font-heading text-[14px] font-semibold text-sf-ink">Dashboard</div>
            <div className="text-[9px] text-sf-muted">Pearly · this week (Aug 13–19, 2025)</div>
          </div>
          <span className="flex items-center gap-1 rounded-md bg-sf-navy px-2 py-1 text-[9px] font-medium text-white"><Sparkles className="size-2.5" /> Ask the assistant</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Kpi label="Revenue" value="€1805" trend="+12%" />
          <Kpi label="Bookings" value="20" trend="7 online" />
          <Kpi label="No-shows" value="0" trend="0%" good />
          <Kpi label="AI-booked" value="2" trend="auto-filled" />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <MiniCard title="Revenue by day">
            <div className="flex h-[78px] items-end gap-1 pt-1">
              {REV.map((d) => (
                <div key={d.d} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[7px] font-medium text-sf-ink2">{d.v ? `€${d.v}` : ""}</span>
                  <div className="w-full rounded-t bg-[#5777B0]" style={{ height: Math.max(d.v ? 4 : 2, Math.round((d.v / maxDay) * 56)), opacity: d.v ? 1 : 0.25 }} />
                  <span className="text-[7px] text-sf-muted">{d.d}</span>
                </div>
              ))}
            </div>
          </MiniCard>
          <MiniCard title="Top services">
            <div className="space-y-1.5 pt-0.5">
              {SERVICES.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-[64px] shrink-0 truncate text-[8.5px] text-sf-ink">{s.name}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded bg-sf-soft"><div className="h-full rounded" style={{ width: `${(s.n / maxSvc) * 100}%`, backgroundColor: s.c }} /></div>
                  <span className="w-3 text-right text-[8px] font-medium text-sf-ink2">{s.n}</span>
                </div>
              ))}
            </div>
          </MiniCard>
        </div>

        <div className="mt-2">
          <MiniCard title="AI insights" accent>
            <div className="flex items-start justify-between gap-2 rounded-md bg-sf-soft p-2">
              <p className="text-[9px] leading-snug text-sf-ink2">1 client hasn&apos;t booked in 60 days. Send a win-back offer?</p>
              <span className="flex shrink-0 items-center gap-0.5 rounded bg-sf-card px-1.5 py-0.5 text-[8.5px] font-medium text-[#5777B0] shadow-sm">Run win-back <ArrowUpRight className="size-2.5" /></span>
            </div>
          </MiniCard>
        </div>
      </div>
    </Frame>
  );
}

// ── Calendar ────────────────────────────────────────────────────────────────
const CAL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BLOCKS: { day: number; top: number; h: number; c: string; t: string }[] = [
  { day: 0, top: 4, h: 22, c: BLUE, t: "Mia · Facial" }, { day: 0, top: 40, h: 16, c: TEAL, t: "Cut" },
  { day: 1, top: 16, h: 18, c: PURPLE, t: "Colour" }, { day: 2, top: 6, h: 16, c: GREEN, t: "Express" },
  { day: 2, top: 30, h: 26, c: RED, t: "Hydra Facial" }, { day: 3, top: 20, h: 20, c: BLUE, t: "Signature" },
  { day: 4, top: 10, h: 16, c: TEAL, t: "Scrub" }, { day: 4, top: 34, h: 22, c: PURPLE, t: "Colour" },
  { day: 5, top: 24, h: 18, c: GREEN, t: "Express" },
];
export function CalendarMock() {
  return (
    <Frame>
      <AppChrome active="Calendar" />
      <div className="bg-sf-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="rounded-full border border-sf-line px-2.5 py-1 text-[9px] font-semibold">TODAY</span>
            <span className="font-heading text-[12px] font-semibold text-sf-ink">Aug 13–19</span>
          </div>
          <div className="flex items-center rounded-md bg-sf-soft p-0.5 text-[9px] font-medium">
            <span className="rounded bg-sf-navy px-2.5 py-1 text-white">Week</span>
            <span className="px-2.5 py-1 text-sf-ink2">Day</span>
          </div>
        </div>
        <div className="grid grid-cols-[20px_repeat(6,1fr)] gap-1">
          <div />
          {CAL_DAYS.map((d) => <div key={d} className="pb-1 text-center text-[8.5px] font-medium text-sf-ink2">{d}</div>)}
          <div className="flex flex-col justify-between pr-1 text-right text-[7px] text-[#c2c6c5]">
            <span>9</span><span>11</span><span>13</span><span>15</span>
          </div>
          {CAL_DAYS.map((_, di) => (
            <div key={di} className="relative h-[88px] rounded border border-sf-line bg-sf-bg2">
              {[22, 44, 66].map((y) => <div key={y} className="absolute inset-x-0 border-t border-sf-line" style={{ top: y }} />)}
              {BLOCKS.filter((b) => b.day === di).map((b, i) => (
                <div key={i} className="absolute inset-x-0.5 overflow-hidden rounded px-1 py-0.5 text-[7px] font-medium text-white" style={{ top: b.top, height: b.h, backgroundColor: b.c }}>{b.t}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

// ── Clients ─────────────────────────────────────────────────────────────────
const CLIENTS = [
  { i: "MC", n: "Mia Chen", e: "mia@gmail.com", tier: "VIP", tc: "bg-[#efe2f6] text-[#7b4fae]", spend: "€1,240" },
  { i: "JR", n: "Jordan Reyes", e: "jordan@me.com", tier: "Gold", tc: "bg-[#fdf3d4] text-[#8a6d2f]", spend: "€880" },
  { i: "CB", n: "Cameron Brennan", e: "+31 6 1234", tier: "Silver", tc: "bg-[#e4e7ec] text-[#475467]", spend: "€420" },
  { i: "AP", n: "Andre Pearl", e: "andre@pearly.nl", tier: "Gold", tc: "bg-[#fdf3d4] text-[#8a6d2f]", spend: "€760" },
  { i: "TS", n: "Tess Okoye", e: "tess@gmail.com", tier: "Standard", tc: "bg-sf-soft text-sf-ink2", spend: "€150" },
];
export function ClientsMock() {
  return (
    <Frame>
      <AppChrome active="Clients" />
      <div className="bg-sf-card">
        <div className="flex items-center justify-between border-b border-sf-line px-3.5 py-2.5">
          <div className="font-heading text-[12px] font-semibold">Clients <span className="text-sf-muted">(248)</span></div>
          <span className="rounded-md bg-sf-navy px-2.5 py-1 text-[9px] font-medium text-white">+ Add client</span>
        </div>
        <div className="border-b border-sf-line px-3.5 py-2">
          <div className="flex items-center gap-1.5 rounded-md bg-sf-soft px-2.5 py-1.5 text-[9px] text-sf-muted"><Search className="size-3" /> Search clients…</div>
        </div>
        {CLIENTS.map((c) => (
          <div key={c.i} className="flex items-center gap-2.5 border-b border-sf-line px-3.5 py-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#cfe4e2] text-[9px] font-semibold text-[#3f968c]">{c.i}</span>
            <div className="min-w-0 flex-1"><div className="truncate text-[10px] font-medium text-sf-ink">{c.n}</div><div className="truncate text-[8.5px] text-sf-muted">{c.e}</div></div>
            <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${c.tc}`}>{c.tier}</span>
            <span className="w-12 text-right text-[9.5px] font-medium">{c.spend}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// ── Calendar sync ───────────────────────────────────────────────────────────
const CONNS = [
  { p: "Google Calendar", who: "mia@pearly.nl", st: "Active", sc: "bg-[#dcefd8] text-[#234A28]" },
  { p: "Apple Calendar", who: "andre@icloud.com", st: "Active", sc: "bg-[#dcefd8] text-[#234A28]" },
  { p: "Outlook", who: "front-desk@pearly.nl", st: "Paused", sc: "bg-[#fdf3d4] text-[#8a6d2f]" },
];
export function SyncMock() {
  return (
    <Frame>
      <AppChrome active="Calendar" />
      <div className="bg-sf-card p-3.5">
        <div className="mb-1 flex items-center gap-1.5">
          <CalendarSync className="size-3.5 text-[#7b4fae]" />
          <div className="font-heading text-[12px] font-semibold text-sf-ink">Calendar sync</div>
        </div>
        <p className="mb-2.5 text-[9px] text-sf-muted">Two-way sync keeps every personal calendar and Schedulemode in lockstep — no double-bookings.</p>
        <div className="space-y-2">
          {CONNS.map((c) => (
            <div key={c.p} className="flex items-center gap-2.5 rounded-lg border border-sf-line bg-sf-card p-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-sf-soft text-[9px] font-bold text-sf-ink2">{c.p[0]}</span>
              <div className="min-w-0 flex-1"><div className="truncate text-[10px] font-medium text-sf-ink">{c.p}</div><div className="truncate text-[8.5px] text-sf-muted">{c.who}</div></div>
              <span className="flex items-center gap-1 text-[8px] text-[#4F9A57]"><CalendarSync className="size-2.5" /> two-way</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${c.sc}`}>{c.st}</span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-sf-soft px-2.5 py-2 text-[9px] text-sf-ink2"><Check className="size-3 text-[#4F9A57]" /> Last sync 30s ago · 142 events mirrored this week</div>
      </div>
    </Frame>
  );
}

// ── Reports ─────────────────────────────────────────────────────────────────
const REV_SVC = [
  { name: "Signature Facial", v: 540, c: BLUE }, { name: "Custom Facial", v: 420, c: PURPLE },
  { name: "Hydra Facial", v: 360, c: RED }, { name: "Express Facial", v: 300, c: GREEN }, { name: "Body Scrub", v: 185, c: TEAL },
];
export function ReportsMock() {
  const maxDay = 665, maxSvc = 540;
  return (
    <Frame>
      <AppChrome active="Reports" />
      <div className="bg-sf-card p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <div className="font-heading text-[14px] font-semibold text-sf-ink">Reports</div>
            <div className="text-[9px] text-sf-muted">This week · Pearly</div>
          </div>
          <span className="rounded-md border border-sf-line bg-sf-card px-2.5 py-1 text-[9px] font-medium text-sf-ink2">Export CSV</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Kpi label="Revenue" value="€1805" trend="+12%" />
          <Kpi label="Completed" value="18" trend="90%" good />
          <Kpi label="No-shows" value="0" trend="0%" good />
          <Kpi label="Avg CLV" value="€612" trend="lifetime" />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <MiniCard title="Revenue by day">
            <div className="flex h-[78px] items-end gap-1 pt-1">
              {REV.map((d) => (
                <div key={d.d} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[7px] font-medium text-sf-ink2">{d.v ? `€${d.v}` : ""}</span>
                  <div className="w-full rounded-t bg-[#5777B0]" style={{ height: Math.max(d.v ? 4 : 2, Math.round((d.v / maxDay) * 56)), opacity: d.v ? 1 : 0.25 }} />
                  <span className="text-[7px] text-sf-muted">{d.d}</span>
                </div>
              ))}
            </div>
          </MiniCard>
          <MiniCard title="Revenue by service">
            <div className="space-y-1.5 pt-0.5">
              {REV_SVC.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-[68px] shrink-0 truncate text-[8.5px] text-sf-ink">{s.name}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded bg-sf-soft"><div className="h-full rounded" style={{ width: `${(s.v / maxSvc) * 100}%`, backgroundColor: s.c }} /></div>
                  <span className="w-9 text-right text-[8px] font-medium text-sf-ink2">€{s.v}</span>
                </div>
              ))}
            </div>
          </MiniCard>
        </div>
      </div>
    </Frame>
  );
}
