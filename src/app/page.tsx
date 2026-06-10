/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarSync,
  Check,
  Gauge,
  Minus,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "SalonFlow — the easiest salon software in the world",
  description:
    "Booking, calendar, payments, clients and marketing in one place. Best-in-class two-way calendar sync and an AI assistant that runs your salon. Live in 10 minutes.",
};

function Frame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e6e7e7] bg-white shadow-[0_24px_70px_-30px_rgba(31,42,77,0.35)]">
      <div className="flex items-center gap-1.5 border-b border-[#eef0f2] bg-[#1f2a4d] px-3 py-2">
        <span className="size-2.5 rounded-full bg-white/30" />
        <span className="size-2.5 rounded-full bg-white/30" />
        <span className="size-2.5 rounded-full bg-white/30" />
        <span className="ml-2 truncate text-[11px] text-white/60">app.salonflow.com</span>
      </div>
      <img src={src} alt={alt} className="block w-full" loading="lazy" />
    </div>
  );
}

const DIFFERENTIATORS = [
  { icon: Gauge, title: "Live in 10 minutes", body: "A setup wizard with smart defaults for your vertical. No onboarding calls, no training, no spreadsheets to import by hand." },
  { icon: CalendarSync, title: "The best calendar sync, period", body: "Real-time two-way sync with Google, Microsoft 365 and Apple. Personal events block bookings automatically — zero double-bookings." },
  { icon: Sparkles, title: "An AI assistant that does the work", body: "“Book Sarah for gel nails Tuesday.” “Fill next week's gaps.” “Who hasn't visited in 60 days?” Just ask — it acts behind a confirm step." },
  { icon: Zap, title: "Everything in one place", body: "Calendar, online booking, payments, clients, memberships, loyalty and marketing — one tool your whole team actually enjoys using." },
];

const FEATURES = [
  {
    id: "features",
    tag: "Calendar & scheduling",
    title: "Take control of your day",
    body: "A fast, color-coded calendar your team runs from any device. Drag to reschedule, book multiple services back-to-back, and see conflicts and gaps before they cost you.",
    bullets: ["Day / week / staff views", "Drag-and-drop reschedule", "Group & back-to-back bookings", "Real-time across the team"],
    img: "/shots/calendar.png",
    alt: "SalonFlow calendar",
    reverse: false,
  },
  {
    tag: "Client management",
    title: "Know every client by heart",
    body: "Rich profiles with history, spend, notes, photos and preferences — plus pet and nail extensions. Loyalty points, tiers and memberships are built in.",
    bullets: ["Visit & spend history", "Before/after photo galleries", "Loyalty points & VIP tiers", "Memberships & packages"],
    img: "/shots/clients.png",
    alt: "Client profiles",
    reverse: true,
  },
  {
    tag: "Real-time calendar sync",
    title: "Never double-book again",
    body: "Connect each staff member's Google, Microsoft or Apple calendar. Their personal events instantly become unavailable time, and every SalonFlow appointment mirrors out — both ways, in real time.",
    bullets: ["Two-way Google / Microsoft / Apple", "Personal events block bookings", "Webhook-driven, near-instant", "Per-staff & multi-location"],
    img: "/shots/sync.png",
    alt: "Calendar sync dashboard",
    reverse: false,
  },
  {
    tag: "Reporting",
    title: "See what's actually working",
    body: "Revenue, retention, no-shows, lifetime value, staff performance and booking channels — at a glance, with one-click CSV export. Your AI assistant turns the numbers into actions.",
    bullets: ["Revenue & retention", "No-show & CLV tracking", "Staff & service breakdowns", "CSV export"],
    img: "/shots/reports.png",
    alt: "Reports",
    reverse: true,
  },
];

const WHO = ["Hair salons", "Nail salons", "Barbershops", "Beauty studios", "Lash & brow", "Spas", "Wellness centers", "Pet grooming"];

const COMPARE: [string, boolean | string, boolean | string][] = [
  ["Setup time", "Under 10 minutes", "Days, with onboarding calls"],
  ["Two-way calendar sync", true, "One-way or none"],
  ["AI scheduling assistant", true, false],
  ["Mobile-first for staff", true, "Desktop-era UI"],
  ["All-in-one (no add-ons)", true, "Paid modules"],
];

const PLANS = [
  { name: "Starter", price: "€0", tag: "solo & new", features: ["Online booking", "1 calendar sync", "SMS + email reminders", "Basic reports"], cta: "Start free", highlight: false },
  { name: "Pro", price: "€49", tag: "most popular", features: ["Everything in Starter", "Memberships & loyalty", "AI assistant", "WhatsApp + automations", "Full reporting"], cta: "Start Pro", highlight: true },
  { name: "Premium", price: "€99", tag: "multi-location", features: ["Everything in Pro", "Multiple locations", "Advanced AI flows", "Priority support", "API access"], cta: "Start Premium", highlight: false },
];

const TESTIMONIALS = [
  { quote: "We were taking bookings the same afternoon we signed up. The calendar sync alone ended our double-booking headaches.", name: "Amara V.", role: "Owner · Lash studio" },
  { quote: "The assistant fills our quiet days without me lifting a finger. It feels like having an extra receptionist.", name: "Daniel R.", role: "Barbershop" },
  { quote: "Memberships and loyalty used to live in three apps. Now it's one screen my whole team understands.", name: "Priya S.", role: "Med spa" },
];

export default function Home() {
  return (
    <main className="bg-white text-[#1f2a4d]">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] bg-[radial-gradient(60%_60%_at_70%_30%,#f7d0e0_0%,#e7d4f6_45%,transparent_75%)] opacity-80" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-10 pt-12 md:grid-cols-2 md:pb-16 md:pt-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eadcf5] bg-white/70 px-3 py-1 text-[12px] font-medium text-[#7b4fae] backdrop-blur">
              <Sparkles className="size-3.5" /> Now with real-time calendar sync + AI
            </span>
            <h1 className="mt-4 text-[42px] font-semibold leading-[1.05] tracking-tight [text-wrap:balance] md:text-[58px]">
              Unlock your salon&apos;s potential
            </h1>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-[#5b6472] [text-wrap:pretty]">
              Booking, calendar, payments, clients and marketing — in one beautifully simple platform your whole team will love. Set up in 10 minutes and start taking bookings today.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/salonflow/signup" className="flex items-center gap-1.5 rounded-xl bg-[#1f2a4d] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#28365f]">
                Start free <ArrowRight className="size-4" />
              </Link>
              <Link href="/salonflow/dashboard" className="rounded-xl border border-[#e6e7e7] bg-white px-6 py-3.5 text-[15px] font-semibold transition-colors hover:bg-[#f8f9fb]">
                See a live demo
              </Link>
            </div>
            <div className="mt-5 flex items-center gap-2 text-[13px] text-[#9097a3]">
              <Check className="size-4 text-[#4F9A57]" /> No card required · cancel anytime
            </div>
          </div>
          <div className="relative">
            <Frame src="/shots/calendar.png" alt="SalonFlow calendar" />
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-[#eef0f2] bg-white px-4 py-3 shadow-lg sm:block">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#7b4fae]"><Sparkles className="size-4" /> AI filled 3 open slots this week</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-[#eef0f2] bg-[#fafbfc]">
        <div className="mx-auto max-w-6xl px-5 py-7">
          <p className="text-center text-[13px] font-medium uppercase tracking-wider text-[#9097a3]">Built for modern salons of every kind</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {WHO.map((w) => (
              <span key={w} className="rounded-full border border-[#e6e7e7] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#5b6472]">{w}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Why different */}
      <section id="why" className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[32px] font-heading font-semibold tracking-tight [text-wrap:balance] md:text-[40px]">Salon software, finally done right</h2>
          <p className="mt-3 text-[16px] text-[#5b6472] [text-wrap:pretty]">Most tools are powerful but painful. SalonFlow is powerful and effortless — here&apos;s what makes it different.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DIFFERENTIATORS.map((d) => (
            <div key={d.title} className="rounded-2xl border border-[#eef0f2] bg-white p-6">
              <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#fbe3ee] to-[#ece0f8] text-[#7b4fae]"><d.icon className="size-5" /></div>
              <h3 className="mt-3.5 text-[16px] font-semibold">{d.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#5b6472]">{d.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dark overview band */}
      <section className="bg-[#1f2a4d] text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <h2 className="mx-auto max-w-2xl text-[30px] font-heading font-semibold tracking-tight [text-wrap:balance] md:text-[40px]">Everything you need to run your salon</h2>
          <p className="mx-auto mt-3 max-w-xl text-[16px] text-white/65 [text-wrap:pretty]">One platform that has quietly replaced the calendar, the POS, the spreadsheet and the four marketing apps.</p>
          <div className="mt-9 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img src="/shots/dashboard.png" alt="SalonFlow dashboard" className="block w-full" loading="lazy" />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {["Calendar", "Online booking", "Payments", "Clients", "Memberships", "Loyalty", "Messaging", "Reporting", "AI assistant", "Calendar sync"].map((f) => (
              <span key={f} className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[13px] font-medium text-white/80">{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Alternating features */}
      <div className="mx-auto max-w-6xl px-5">
        {FEATURES.map((f) => (
          <section key={f.title} id={f.id} className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-20">
            <div className={f.reverse ? "md:order-2" : ""}>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-[#b07fd0]">{f.tag}</div>
              <h3 className="mt-2 text-[28px] font-heading font-semibold tracking-tight [text-wrap:balance] md:text-[34px]">{f.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-[#5b6472] [text-wrap:pretty]">{f.body}</p>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[14px] text-[#3f4658]"><Check className="mt-0.5 size-4 shrink-0 text-[#4F9A57]" /> {b}</li>
                ))}
              </ul>
            </div>
            <div className={f.reverse ? "md:order-1" : ""}>
              <Frame src={f.img} alt={f.alt} />
            </div>
          </section>
        ))}
      </div>

      {/* Who it's for */}
      <section id="who" className="bg-[#fafbfc]">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[30px] font-heading font-semibold tracking-tight [text-wrap:balance] md:text-[38px]">One platform, every kind of salon</h2>
            <p className="mt-3 text-[16px] text-[#5b6472]">Smart defaults per vertical mean you&apos;re live in minutes, whatever you do.</p>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {WHO.map((w, i) => (
              <div key={w} className="flex items-center gap-2.5 rounded-xl border border-[#eef0f2] bg-white px-4 py-4">
                <span className="size-2.5 rounded-full" style={{ background: ["#4F9A57", "#8B5FB8", "#D06277", "#5777B0", "#3F968C", "#e6b54a", "#7b4fae", "#4F9A57"][i % 8] }} />
                <span className="text-[14px] font-medium">{w}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare */}
      <section className="mx-auto max-w-4xl px-5 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[30px] font-heading font-semibold tracking-tight [text-wrap:balance] md:text-[38px]">Why salons switch to SalonFlow</h2>
          <p className="mt-3 text-[16px] text-[#5b6472]">The all-in-one experience legacy salon software can&apos;t match.</p>
        </div>
        <div className="mt-9 overflow-hidden rounded-2xl border border-[#eef0f2]">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-[#f6f7f9] text-[13px] font-semibold">
            <div className="px-4 py-3 text-[#5b6472]" />
            <div className="px-4 py-3 text-center text-[#1f2a4d]">SalonFlow</div>
            <div className="px-4 py-3 text-center text-[#9097a3]">Typical salon software</div>
          </div>
          {COMPARE.map(([label, a, b], i) => (
            <div key={label} className={`grid grid-cols-[1.4fr_1fr_1fr] items-center text-[14px] ${i % 2 ? "bg-white" : "bg-[#fcfcfd]"}`}>
              <div className="px-4 py-3.5 font-medium text-[#1f2a4d]">{label}</div>
              <Cell v={a} accent />
              <Cell v={b} />
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#fafbfc]">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-1">{[...Array(5)].map((_, i) => <Star key={i} className="size-5 fill-[#e6b54a] text-[#e6b54a]" />)}</div>
            <h2 className="mt-3 text-[30px] font-heading font-semibold tracking-tight [text-wrap:balance] md:text-[38px]">Loved by busy salon teams</h2>
            <p className="mt-2 text-[13px] text-[#9097a3]">Illustrative testimonials from the demo.</p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-[#eef0f2] bg-white p-6">
                <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-[#e6b54a] text-[#e6b54a]" />)}</div>
                <p className="mt-3 text-[15px] leading-relaxed text-[#3f4658]">“{t.quote}”</p>
                <div className="mt-4 flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#f0a8c0] to-[#9a7bd6] text-[12px] font-semibold text-white">{t.name[0]}</span>
                  <div><div className="text-[14px] font-semibold">{t.name}</div><div className="text-[12px] text-[#9097a3]">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[30px] font-heading font-semibold tracking-tight [text-wrap:balance] md:text-[38px]">Simple pricing, per location</h2>
          <p className="mt-3 text-[16px] text-[#5b6472]">Start free. Upgrade when you grow.</p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`rounded-2xl border bg-white p-6 ${p.highlight ? "border-[#1f2a4d] ring-1 ring-[#1f2a4d]" : "border-[#eef0f2]"}`}>
              <div className="flex items-center justify-between"><h3 className="text-[18px] font-semibold">{p.name}</h3>{p.highlight && <span className="rounded-full bg-gradient-to-r from-[#f0a8c0] to-[#9a7bd6] px-2.5 py-0.5 text-[11px] font-semibold text-white">Popular</span>}</div>
              <div className="mt-2 text-[34px] font-semibold">{p.price}<span className="text-[14px] font-normal text-[#9097a3]">/mo</span></div>
              <div className="text-[12px] text-[#9097a3]">{p.tag}</div>
              <ul className="mt-4 space-y-2 text-[14px] text-[#3f4658]">{p.features.map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#4F9A57]" /> {f}</li>)}</ul>
              <Link href="/salonflow/signup" className={`mt-5 block rounded-xl py-3 text-center text-[14px] font-semibold transition-colors ${p.highlight ? "bg-[#1f2a4d] text-white hover:bg-[#28365f]" : "border border-[#e6e7e7] hover:bg-[#f8f9fb]"}`}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-[#1f2a4d] px-8 py-16 text-center text-white">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-[radial-gradient(circle,#9a7bd6_0%,transparent_70%)] opacity-50" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full bg-[radial-gradient(circle,#f0a8c0_0%,transparent_70%)] opacity-40" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-[32px] font-heading font-semibold tracking-tight [text-wrap:balance] md:text-[42px]">Switch to SalonFlow with zero downtime</h2>
            <p className="mx-auto mt-3 max-w-md text-[16px] text-white/70">Set up in 10 minutes, keep your calendar in sync, and take your first booking today.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/salonflow/signup" className="flex items-center gap-1.5 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-[#1f2a4d] hover:bg-white/90">Start free <ArrowRight className="size-4" /></Link>
              <Link href="/salonflow/dashboard" className="rounded-xl border border-white/25 px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-white/10">Explore the demo</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Cell({ v, accent }: { v: boolean | string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-center px-4 py-3.5">
      {v === true ? (
        <span className={`grid size-6 place-items-center rounded-full ${accent ? "bg-[#dcefd8] text-[#234A28]" : "bg-[#f0f1f1] text-[#9fa5a4]"}`}><Check className="size-3.5" /></span>
      ) : v === false ? (
        <span className="grid size-6 place-items-center rounded-full bg-[#f0f1f1] text-[#c2c6c5]"><Minus className="size-3.5" /></span>
      ) : (
        <span className={`text-center text-[13px] ${accent ? "font-medium text-[#1f2a4d]" : "text-[#9097a3]"}`}>{v}</span>
      )}
    </div>
  );
}
