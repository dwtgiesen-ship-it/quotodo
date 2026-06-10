import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarSync,
  Check,
  CreditCard,
  MessageSquare,
  Smartphone,
  Sparkles,
  Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SalonFlow — the easiest salon software in the world",
  description: "Set up in 10 minutes. Best-in-class calendar sync, online booking, payments, memberships, and an AI assistant that runs your salon.",
};

const FEATURES = [
  { icon: CalendarSync, title: "Best calendar sync in the market", body: "Real-time two-way sync with Google, Microsoft 365, and Apple. Changes flow both ways. Zero double-bookings — ever." },
  { icon: Sparkles, title: "An AI assistant that does the work", body: "“Book Sarah for gel nails next Tuesday.” “Fill next week's empty slots.” “Who hasn't visited in 60 days?” Just ask." },
  { icon: Smartphone, title: "Mobile-first, zero training", body: "Run your whole day from your phone. The interface is so simple your team is productive on day one." },
  { icon: CreditCard, title: "Payments, deposits & memberships", body: "Take deposits to kill no-shows, sell memberships and gift cards, and get paid — powered by Stripe." },
  { icon: MessageSquare, title: "Automated client comms", body: "Confirmations, reminders, review requests, birthday and win-back campaigns over SMS, email & WhatsApp." },
  { icon: Star, title: "Loyalty that brings them back", body: "Points, tiers, referral and birthday rewards — automatic, and tuned by your AI assistant." },
];

const PLANS = [
  { name: "Starter", price: "€0", tag: "for solo & new", features: ["Online booking", "1 calendar sync", "SMS + email reminders", "Basic reports"], cta: "Start free" },
  { name: "Pro", price: "€49", tag: "most popular", features: ["Everything in Starter", "Memberships & loyalty", "AI assistant", "WhatsApp + full automations", "Multi-staff", "Full reporting"], cta: "Start Pro", highlight: true },
  { name: "Premium", price: "€99", tag: "multi-location", features: ["Everything in Pro", "Multiple locations", "Advanced AI automations", "Priority support", "API access"], cta: "Start Premium" },
];

export default function SalonFlowLanding() {
  return (
    <main className="min-h-screen bg-white text-[#1f2a4d]">
      {/* nav */}
      <header className="sticky top-0 z-20 border-b border-[#eef0f2] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-gradient-to-br from-[#f0a8c0] to-[#9a7bd6] text-sm font-bold text-white">S</span>
            <span className="text-[16px] font-semibold">SalonFlow</span>
          </div>
          <nav className="hidden items-center gap-6 text-[14px] text-[#6b7280] md:flex">
            <a href="#features" className="hover:text-[#1f2a4d]">Features</a>
            <a href="#pricing" className="hover:text-[#1f2a4d]">Pricing</a>
            <Link href="/salonflow/book" className="hover:text-[#1f2a4d]">Book a demo</Link>
          </nav>
          <Link href="/salonflow/dashboard" className="rounded-lg bg-[#1f2a4d] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#28356180]">Open the app</Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#efe2f6] px-3 py-1 text-[12px] font-medium text-[#7b4fae]"><Sparkles className="size-3.5" /> Live in 10 minutes</span>
            <h1 className="mt-4 text-[40px] font-semibold leading-[1.1] tracking-tight text-balance md:text-[52px]">The easiest salon software in the world.</h1>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[#6b7280] text-pretty">Booking, calendar, payments, clients, and marketing — run it all by talking to SalonFlow. Built for nail, hair, beauty, barber, lash, spa, and pet-grooming businesses.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/salonflow/onboarding" className="flex items-center gap-1.5 rounded-lg bg-[#1f2a4d] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#28356180]">Start free <ArrowRight className="size-4" /></Link>
              <Link href="/salonflow/dashboard" className="rounded-lg border border-[#e6e7e7] px-5 py-3 text-[14px] font-semibold hover:bg-[#f8f9f9]">See the dashboard</Link>
            </div>
            <div className="mt-5 flex items-center gap-2 text-[13px] text-[#9fa5a4]"><Check className="size-4 text-[#4F9A57]" /> No card required · cancel anytime</div>
          </div>
          {/* product mock */}
          <div className="relative">
            <div className="rounded-2xl border border-[#e6e7e7] bg-[#f4f5f4] p-3 shadow-2xl">
              <div className="overflow-hidden rounded-xl border border-[#e6e7e7] bg-white">
                <div className="flex items-center gap-1.5 border-b border-[#eef0f2] bg-[#1f2a4d] px-3 py-2">
                  <span className="size-2.5 rounded-full bg-white/30" /><span className="size-2.5 rounded-full bg-white/30" /><span className="size-2.5 rounded-full bg-white/30" />
                  <span className="ml-2 text-[11px] text-white/70">app.salonflow.com/calendar</span>
                </div>
                <div className="grid grid-cols-7 gap-px bg-[#eef0f2] p-px">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const fills = ["#DCEFD8", "#E8DCF4", "#FBD9DE", "#D9E5F6", "transparent", "transparent"];
                    const c = fills[(i * 3) % fills.length];
                    return <div key={i} className="h-9 bg-white p-1"><div className="h-full rounded" style={{ backgroundColor: c }} /></div>;
                  })}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-[#e6e7e7] bg-white px-3 py-2 text-[12px] shadow-lg sm:block">
              <div className="flex items-center gap-1.5 font-medium text-[#7b4fae]"><Sparkles className="size-3.5" /> AI booked 3 appointments</div>
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="border-t border-[#eef0f2] bg-[#fafbfc]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-[30px] font-semibold tracking-tight text-balance">Everything to run the salon — nothing in the way</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-[#e6e7e7] bg-white p-6">
                <div className="grid size-10 place-items-center rounded-lg bg-[#f4f6fb] text-[#5777B0]"><f.icon className="size-5" /></div>
                <h3 className="mt-3 text-[16px] font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#6b7280]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-[30px] font-semibold tracking-tight">Simple pricing, per location</h2>
        <p className="mt-2 text-center text-[14px] text-[#6b7280]">Start free. Upgrade when you grow. Payments &amp; marketplace add usage-based upside.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`rounded-2xl border bg-white p-6 ${p.highlight ? "border-[#1f2a4d] ring-1 ring-[#1f2a4d]" : "border-[#e6e7e7]"}`}>
              <div className="flex items-center justify-between"><h3 className="text-[18px] font-semibold">{p.name}</h3>{p.highlight && <span className="rounded-full bg-[#1f2a4d] px-2.5 py-0.5 text-[11px] font-medium text-white">Popular</span>}</div>
              <div className="mt-2 text-[32px] font-semibold">{p.price}<span className="text-[14px] font-normal text-[#9fa5a4]">/mo</span></div>
              <div className="text-[12px] text-[#9fa5a4]">{p.tag}</div>
              <ul className="mt-4 space-y-2 text-[14px] text-[#3f4544]">{p.features.map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#4F9A57]" /> {f}</li>)}</ul>
              <Link href="/salonflow/onboarding" className={`mt-5 block rounded-lg py-2.5 text-center text-[14px] font-semibold ${p.highlight ? "bg-[#1f2a4d] text-white hover:bg-[#28356180]" : "border border-[#e6e7e7] hover:bg-[#f8f9f9]"}`}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* cta */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl bg-[#1f2a4d] px-8 py-14 text-center text-white">
          <h2 className="text-[30px] font-semibold tracking-tight text-balance">Your salon, running itself by tomorrow morning.</h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-white/70">Set up in 10 minutes. Take your first booking today.</p>
          <Link href="/salonflow/onboarding" className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-white px-6 py-3 text-[14px] font-semibold text-[#1f2a4d] hover:bg-white/90">Get started free <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-[#eef0f2]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-[13px] text-[#9fa5a4] sm:flex-row">
          <span>© {new Date().getFullYear()} SalonFlow (demo). Built on Next.js.</span>
          <span>Competing with Fresha · Vagaro · Treatwell · Timely · Salonized</span>
        </div>
      </footer>
    </main>
  );
}
