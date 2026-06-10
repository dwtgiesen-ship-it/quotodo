import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarSync, Check, Gauge, Minus, Sparkles, Star, Zap } from "lucide-react";
import { getDict } from "@/lib/i18n-server";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { CalendarMock, ClientsMock, DashboardMock, ReportsMock, SyncMock } from "@/components/marketing/mockups";

export const metadata: Metadata = {
  title: "Schedulemode — the easiest salon software in the world",
  description: "Booking, calendar, payments, clients and marketing in one place. Best-in-class two-way calendar sync and an AI assistant that runs your salon. Live in 10 minutes.",
};

const DIFF_ICONS = [Gauge, CalendarSync, Sparkles, Zap];
// Live, always-in-sync product mockups (one per alternating feature section).
const FEATURE_MOCKS = [CalendarMock, ClientsMock, SyncMock, ReportsMock];
const WHO_DOTS = ["#4F9A57", "#8B5FB8", "#D06277", "#5777B0", "#3F968C", "#e6b54a", "#7b4fae", "#4F9A57"];

export default async function Home() {
  const d = await getDict();
  return (
    <main className="bg-sf-bg text-sf-ink">
      <SiteNav t={d.nav} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-[560px] bg-[radial-gradient(55%_60%_at_72%_28%,rgba(154,108,255,0.22)_0%,rgba(216,165,255,0.12)_42%,transparent_72%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-10 pt-12 md:grid-cols-2 md:pb-16 md:pt-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sf-line bg-sf-card/70 px-3 py-1 text-[12px] font-medium text-sf-accent backdrop-blur">
              <Sparkles className="size-3.5" /> {d.hero.badge}
            </span>
            <h1 className="mt-4 font-heading text-[44px] font-bold leading-[1.03] tracking-tight [text-wrap:balance] md:text-[60px]">{d.hero.title}</h1>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-sf-ink2 [text-wrap:pretty]">{d.hero.subtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/salonflow/signup" className="btn-accent flex items-center gap-1.5 rounded-full px-6 py-3.5 text-[15px] font-semibold">{d.hero.ctaPrimary} <ArrowRight className="size-4" /></Link>
              <Link href="/salonflow/dashboard" className="rounded-full border border-sf-line bg-sf-card px-6 py-3.5 text-[15px] font-semibold text-sf-ink transition-colors hover:bg-sf-soft">{d.hero.ctaSecondary}</Link>
            </div>
            <div className="mt-5 flex items-center gap-2 text-[13px] text-sf-muted"><Check className="size-4 text-[#4F9A57]" /> {d.hero.noCard}</div>
          </div>
          <div className="relative">
            <DashboardMock />
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-sf-line bg-sf-card px-4 py-3 shadow-lg sm:block">
              <div className="flex items-center gap-2 text-[13px] font-medium text-sf-accent"><Sparkles className="size-4" /> {d.hero.floatCard}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-sf-line bg-sf-bg2">
        <div className="mx-auto max-w-6xl px-5 py-7">
          <p className="text-center text-[13px] font-medium uppercase tracking-wider text-sf-muted">{d.trust}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {d.who.map((w) => <span key={w} className="rounded-full border border-sf-line bg-sf-card px-3.5 py-1.5 text-[13px] font-medium text-sf-ink2">{w}</span>)}
          </div>
        </div>
      </section>

      {/* Why different */}
      <section id="why" className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-[32px] font-bold tracking-tight [text-wrap:balance] md:text-[40px]">{d.why.title}</h2>
          <p className="mt-3 text-[16px] text-sf-ink2 [text-wrap:pretty]">{d.why.subtitle}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.why.items.map((item, i) => {
            const Icon = DIFF_ICONS[i];
            return (
              <div key={item.title} className="rounded-2xl border border-sf-line bg-sf-card p-6">
                <div className="grid size-11 place-items-center rounded-xl bg-sf-soft text-sf-accent"><Icon className="size-5" /></div>
                <h3 className="mt-3.5 text-[16px] font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-sf-ink2">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dark overview band */}
      <section className="bg-sf-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <h2 className="mx-auto max-w-2xl font-heading text-[30px] font-bold tracking-tight [text-wrap:balance] md:text-[40px]">{d.band.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-[16px] text-white/65 [text-wrap:pretty]">{d.band.subtitle}</p>
          <div className="mx-auto mt-9 max-w-3xl"><DashboardMock /></div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {d.band.pills.map((f) => <span key={f} className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[13px] font-medium text-white/80">{f}</span>)}
          </div>
        </div>
      </section>

      {/* Alternating features */}
      <div className="mx-auto max-w-6xl px-5">
        {d.features.map((f, i) => {
          const reverse = i % 2 === 1;
          const Mock = FEATURE_MOCKS[i % FEATURE_MOCKS.length];
          return (
            <section key={f.title} id={i === 0 ? "features" : undefined} className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-20">
              <div className={reverse ? "md:order-2" : ""}>
                <div className="text-[12px] font-semibold uppercase tracking-wider text-gradient">{f.tag}</div>
                <h3 className="mt-2 font-heading text-[28px] font-bold tracking-tight [text-wrap:balance] md:text-[34px]">{f.title}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-sf-ink2 [text-wrap:pretty]">{f.body}</p>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {f.bullets.map((b) => <li key={b} className="flex items-start gap-2 text-[14px] text-sf-ink2"><Check className="mt-0.5 size-4 shrink-0 text-[#4F9A57]" /> {b}</li>)}
                </ul>
              </div>
              <div className={reverse ? "md:order-1" : ""}><Mock /></div>
            </section>
          );
        })}
      </div>

      {/* Who it's for */}
      <section id="who" className="bg-sf-bg2">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-[30px] font-bold tracking-tight [text-wrap:balance] md:text-[38px]">{d.whoSection.title}</h2>
            <p className="mt-3 text-[16px] text-sf-ink2">{d.whoSection.subtitle}</p>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {d.who.map((w, i) => (
              <div key={w} className="flex items-center gap-2.5 rounded-xl border border-sf-line bg-sf-card px-4 py-4">
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
          <h2 className="font-heading text-[30px] font-bold tracking-tight [text-wrap:balance] md:text-[38px]">{d.compare.title}</h2>
          <p className="mt-3 text-[16px] text-sf-ink2">{d.compare.subtitle}</p>
        </div>
        <div className="mt-9 overflow-hidden rounded-2xl border border-sf-line">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-sf-bg2 text-[13px] font-semibold">
            <div className="px-4 py-3 text-sf-ink2" />
            <div className="px-4 py-3 text-center text-sf-ink">{d.compare.us}</div>
            <div className="px-4 py-3 text-center text-sf-muted">{d.compare.them}</div>
          </div>
          {d.compare.rows.map(([label, a, b], i) => (
            <div key={label} className={`grid grid-cols-[1.4fr_1fr_1fr] items-center text-[14px] ${i % 2 ? "bg-sf-card" : "bg-sf-bg2"}`}>
              <div className="px-4 py-3.5 font-medium text-sf-ink">{label}</div>
              <Cell v={a} accent /><Cell v={b} />
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-sf-bg2">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-1">{[...Array(5)].map((_, i) => <Star key={i} className="size-5 fill-[#e6b54a] text-[#e6b54a]" />)}</div>
            <h2 className="mt-3 font-heading text-[30px] font-bold tracking-tight [text-wrap:balance] md:text-[38px]">{d.testimonials.title}</h2>
            <p className="mt-2 text-[13px] text-sf-muted">{d.testimonials.note}</p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {d.testimonials.items.map((t) => (
              <div key={t.name} className="rounded-2xl border border-sf-line bg-sf-card p-6">
                <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-[#e6b54a] text-[#e6b54a]" />)}</div>
                <p className="mt-3 text-[15px] leading-relaxed text-sf-ink2">“{t.quote}”</p>
                <div className="mt-4 flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-sf-accent2 to-sf-accent text-[12px] font-semibold text-white">{t.name[0]}</span>
                  <div><div className="text-[14px] font-semibold">{t.name}</div><div className="text-[12px] text-sf-muted">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-[30px] font-bold tracking-tight [text-wrap:balance] md:text-[38px]">{d.pricing.title}</h2>
          <p className="mt-3 text-[16px] text-sf-ink2">{d.pricing.subtitle}</p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {d.pricing.plans.map((p, i) => {
            const highlight = i === 1;
            return (
              <div key={p.name} className={`rounded-2xl border bg-sf-card p-6 ${highlight ? "border-sf-accent ring-1 ring-sf-accent" : "border-sf-line"}`}>
                <div className="flex items-center justify-between"><h3 className="text-[18px] font-semibold">{p.name}</h3>{highlight && <span className="rounded-full bg-gradient-to-r from-sf-accent2 to-sf-accent px-2.5 py-0.5 text-[11px] font-semibold text-white">{d.pricing.popular}</span>}</div>
                <div className="mt-2 text-[34px] font-bold">{p.price}<span className="text-[14px] font-normal text-sf-muted">{d.pricing.per}</span></div>
                <div className="text-[12px] text-sf-muted">{p.tag}</div>
                <ul className="mt-4 space-y-2 text-[14px] text-sf-ink2">{p.features.map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#4F9A57]" /> {f}</li>)}</ul>
                <Link href="/salonflow/signup" className={`mt-5 block rounded-full py-3 text-center text-[14px] font-semibold transition-colors ${highlight ? "btn-accent" : "border border-sf-line text-sf-ink hover:bg-sf-soft"}`}>{p.cta}</Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-sf-navy px-8 py-16 text-center text-white">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-[radial-gradient(circle,#9a6cff_0%,transparent_70%)] opacity-55" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full bg-[radial-gradient(circle,#d8a5ff_0%,transparent_70%)] opacity-40" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-heading text-[32px] font-bold tracking-tight [text-wrap:balance] md:text-[42px]">{d.finalCta.title}</h2>
            <p className="mx-auto mt-3 max-w-md text-[16px] text-white/70">{d.finalCta.subtitle}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/salonflow/signup" className="btn-accent flex items-center gap-1.5 rounded-full px-6 py-3.5 text-[15px] font-semibold">{d.finalCta.ctaPrimary} <ArrowRight className="size-4" /></Link>
              <Link href="/salonflow/dashboard" className="rounded-full border border-white/25 px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-white/10">{d.finalCta.ctaSecondary}</Link>
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
        <span className={`grid size-6 place-items-center rounded-full ${accent ? "bg-[#dcefd8] text-[#234A28]" : "bg-sf-soft text-sf-muted"}`}><Check className="size-3.5" /></span>
      ) : v === false ? (
        <span className="grid size-6 place-items-center rounded-full bg-sf-soft text-sf-muted"><Minus className="size-3.5" /></span>
      ) : (
        <span className={`text-center text-[13px] ${accent ? "font-medium text-sf-ink" : "text-sf-muted"}`}>{v}</span>
      )}
    </div>
  );
}
