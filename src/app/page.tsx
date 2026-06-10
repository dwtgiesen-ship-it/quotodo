/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarSync, Check, Gauge, Minus, Sparkles, Star, Zap } from "lucide-react";
import { getDict } from "@/lib/i18n-server";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Schedulemode — the easiest salon software in the world",
  description: "Booking, calendar, payments, clients and marketing in one place. Best-in-class two-way calendar sync and an AI assistant that runs your salon. Live in 10 minutes.",
};

const DIFF_ICONS = [Gauge, CalendarSync, Sparkles, Zap];
const FEATURE_IMGS = [
  { img: "/shots/calendar.png", alt: "Schedulemode calendar" },
  { img: "/shots/clients.png", alt: "Client profiles" },
  { img: "/shots/sync.png", alt: "Calendar sync" },
  { img: "/shots/reports.png", alt: "Reports" },
];
const WHO_DOTS = ["#4F9A57", "#8B5FB8", "#D06277", "#5777B0", "#3F968C", "#e6b54a", "#7b4fae", "#4F9A57"];

function Frame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e6e7e7] bg-white shadow-[0_24px_70px_-30px_rgba(31,42,77,0.35)]">
      <div className="flex items-center gap-1.5 border-b border-[#eef0f2] bg-[#1f2a4d] px-3 py-2">
        <span className="size-2.5 rounded-full bg-white/30" /><span className="size-2.5 rounded-full bg-white/30" /><span className="size-2.5 rounded-full bg-white/30" />
        <span className="ml-2 truncate text-[11px] text-white/60">app.schedulemode.com</span>
      </div>
      <img src={src} alt={alt} className="block w-full" loading="lazy" />
    </div>
  );
}

export default async function Home() {
  const d = await getDict();
  return (
    <main className="bg-white text-[#1f2a4d]">
      <SiteNav t={d.nav} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] bg-[radial-gradient(60%_60%_at_70%_30%,#f7d0e0_0%,#e7d4f6_45%,transparent_75%)] opacity-80" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-10 pt-12 md:grid-cols-2 md:pb-16 md:pt-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eadcf5] bg-white/70 px-3 py-1 text-[12px] font-medium text-[#7b4fae] backdrop-blur">
              <Sparkles className="size-3.5" /> {d.hero.badge}
            </span>
            <h1 className="mt-4 font-heading text-[42px] font-semibold leading-[1.05] tracking-tight [text-wrap:balance] md:text-[58px]">{d.hero.title}</h1>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-[#5b6472] [text-wrap:pretty]">{d.hero.subtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/salonflow/signup" className="flex items-center gap-1.5 rounded-xl bg-[#1f2a4d] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#28365f]">{d.hero.ctaPrimary} <ArrowRight className="size-4" /></Link>
              <Link href="/salonflow/dashboard" className="rounded-xl border border-[#e6e7e7] bg-white px-6 py-3.5 text-[15px] font-semibold transition-colors hover:bg-[#f8f9fb]">{d.hero.ctaSecondary}</Link>
            </div>
            <div className="mt-5 flex items-center gap-2 text-[13px] text-[#9097a3]"><Check className="size-4 text-[#4F9A57]" /> {d.hero.noCard}</div>
          </div>
          <div className="relative">
            <Frame src="/shots/calendar.png" alt="Schedulemode calendar" />
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-[#eef0f2] bg-white px-4 py-3 shadow-lg sm:block">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#7b4fae]"><Sparkles className="size-4" /> {d.hero.floatCard}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-[#eef0f2] bg-[#fafbfc]">
        <div className="mx-auto max-w-6xl px-5 py-7">
          <p className="text-center text-[13px] font-medium uppercase tracking-wider text-[#9097a3]">{d.trust}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {d.who.map((w) => <span key={w} className="rounded-full border border-[#e6e7e7] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#5b6472]">{w}</span>)}
          </div>
        </div>
      </section>

      {/* Why different */}
      <section id="why" className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-[32px] font-semibold tracking-tight [text-wrap:balance] md:text-[40px]">{d.why.title}</h2>
          <p className="mt-3 text-[16px] text-[#5b6472] [text-wrap:pretty]">{d.why.subtitle}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.why.items.map((item, i) => {
            const Icon = DIFF_ICONS[i];
            return (
              <div key={item.title} className="rounded-2xl border border-[#eef0f2] bg-white p-6">
                <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#fbe3ee] to-[#ece0f8] text-[#7b4fae]"><Icon className="size-5" /></div>
                <h3 className="mt-3.5 text-[16px] font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#5b6472]">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dark overview band */}
      <section className="bg-[#1f2a4d] text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <h2 className="mx-auto max-w-2xl font-heading text-[30px] font-semibold tracking-tight [text-wrap:balance] md:text-[40px]">{d.band.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-[16px] text-white/65 [text-wrap:pretty]">{d.band.subtitle}</p>
          <div className="mt-9 overflow-hidden rounded-2xl border border-white/10 shadow-2xl"><img src="/shots/dashboard.png" alt="Schedulemode dashboard" className="block w-full" loading="lazy" /></div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {d.band.pills.map((f) => <span key={f} className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[13px] font-medium text-white/80">{f}</span>)}
          </div>
        </div>
      </section>

      {/* Alternating features */}
      <div className="mx-auto max-w-6xl px-5">
        {d.features.map((f, i) => {
          const reverse = i % 2 === 1;
          const media = FEATURE_IMGS[i];
          return (
            <section key={f.title} id={i === 0 ? "features" : undefined} className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-20">
              <div className={reverse ? "md:order-2" : ""}>
                <div className="text-[12px] font-semibold uppercase tracking-wider text-[#b07fd0]">{f.tag}</div>
                <h3 className="mt-2 font-heading text-[28px] font-semibold tracking-tight [text-wrap:balance] md:text-[34px]">{f.title}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-[#5b6472] [text-wrap:pretty]">{f.body}</p>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {f.bullets.map((b) => <li key={b} className="flex items-start gap-2 text-[14px] text-[#3f4658]"><Check className="mt-0.5 size-4 shrink-0 text-[#4F9A57]" /> {b}</li>)}
                </ul>
              </div>
              <div className={reverse ? "md:order-1" : ""}><Frame src={media.img} alt={media.alt} /></div>
            </section>
          );
        })}
      </div>

      {/* Who it's for */}
      <section id="who" className="bg-[#fafbfc]">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-[30px] font-semibold tracking-tight [text-wrap:balance] md:text-[38px]">{d.whoSection.title}</h2>
            <p className="mt-3 text-[16px] text-[#5b6472]">{d.whoSection.subtitle}</p>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {d.who.map((w, i) => (
              <div key={w} className="flex items-center gap-2.5 rounded-xl border border-[#eef0f2] bg-white px-4 py-4">
                <span className="size-2.5 rounded-full" style={{ background: WHO_DOTS[i % 8] }} />
                <span className="text-[14px] font-medium">{w}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare */}
      <section className="mx-auto max-w-4xl px-5 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-[30px] font-semibold tracking-tight [text-wrap:balance] md:text-[38px]">{d.compare.title}</h2>
          <p className="mt-3 text-[16px] text-[#5b6472]">{d.compare.subtitle}</p>
        </div>
        <div className="mt-9 overflow-hidden rounded-2xl border border-[#eef0f2]">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-[#f6f7f9] text-[13px] font-semibold">
            <div className="px-4 py-3 text-[#5b6472]" />
            <div className="px-4 py-3 text-center text-[#1f2a4d]">{d.compare.us}</div>
            <div className="px-4 py-3 text-center text-[#9097a3]">{d.compare.them}</div>
          </div>
          {d.compare.rows.map(([label, a, b], i) => (
            <div key={label} className={`grid grid-cols-[1.4fr_1fr_1fr] items-center text-[14px] ${i % 2 ? "bg-white" : "bg-[#fcfcfd]"}`}>
              <div className="px-4 py-3.5 font-medium text-[#1f2a4d]">{label}</div>
              <Cell v={a} accent /><Cell v={b} />
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#fafbfc]">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-1">{[...Array(5)].map((_, i) => <Star key={i} className="size-5 fill-[#e6b54a] text-[#e6b54a]" />)}</div>
            <h2 className="mt-3 font-heading text-[30px] font-semibold tracking-tight [text-wrap:balance] md:text-[38px]">{d.testimonials.title}</h2>
            <p className="mt-2 text-[13px] text-[#9097a3]">{d.testimonials.note}</p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {d.testimonials.items.map((t) => (
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
          <h2 className="font-heading text-[30px] font-semibold tracking-tight [text-wrap:balance] md:text-[38px]">{d.pricing.title}</h2>
          <p className="mt-3 text-[16px] text-[#5b6472]">{d.pricing.subtitle}</p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {d.pricing.plans.map((p, i) => {
            const highlight = i === 1;
            return (
              <div key={p.name} className={`rounded-2xl border bg-white p-6 ${highlight ? "border-[#1f2a4d] ring-1 ring-[#1f2a4d]" : "border-[#eef0f2]"}`}>
                <div className="flex items-center justify-between"><h3 className="text-[18px] font-semibold">{p.name}</h3>{highlight && <span className="rounded-full bg-gradient-to-r from-[#f0a8c0] to-[#9a7bd6] px-2.5 py-0.5 text-[11px] font-semibold text-white">{d.pricing.popular}</span>}</div>
                <div className="mt-2 text-[34px] font-semibold">{p.price}<span className="text-[14px] font-normal text-[#9097a3]">{d.pricing.per}</span></div>
                <div className="text-[12px] text-[#9097a3]">{p.tag}</div>
                <ul className="mt-4 space-y-2 text-[14px] text-[#3f4658]">{p.features.map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#4F9A57]" /> {f}</li>)}</ul>
                <Link href="/salonflow/signup" className={`mt-5 block rounded-xl py-3 text-center text-[14px] font-semibold transition-colors ${highlight ? "bg-[#1f2a4d] text-white hover:bg-[#28365f]" : "border border-[#e6e7e7] hover:bg-[#f8f9fb]"}`}>{p.cta}</Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-[#1f2a4d] px-8 py-16 text-center text-white">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-[radial-gradient(circle,#9a7bd6_0%,transparent_70%)] opacity-50" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full bg-[radial-gradient(circle,#f0a8c0_0%,transparent_70%)] opacity-40" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-heading text-[32px] font-semibold tracking-tight [text-wrap:balance] md:text-[42px]">{d.finalCta.title}</h2>
            <p className="mx-auto mt-3 max-w-md text-[16px] text-white/70">{d.finalCta.subtitle}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/salonflow/signup" className="flex items-center gap-1.5 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-[#1f2a4d] hover:bg-white/90">{d.finalCta.ctaPrimary} <ArrowRight className="size-4" /></Link>
              <Link href="/salonflow/dashboard" className="rounded-xl border border-white/25 px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-white/10">{d.finalCta.ctaSecondary}</Link>
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
