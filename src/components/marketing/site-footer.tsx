import Link from "next/link";
import { getDict } from "@/lib/i18n-server";
import { LanguageSwitcher } from "./language-switcher";

export async function SiteFooter() {
  const d = await getDict();
  const COLS: { title: string; links: { label: string; href: string }[] }[] = [
    { title: d.footer.cols.platform, links: [
      { label: d.nav.why, href: "#why" }, { label: d.nav.pricing, href: "#pricing" },
      { label: d.hero.ctaSecondary, href: "/salonflow/dashboard" }, { label: d.nav.startFree, href: "/salonflow/signup" }, { label: d.nav.login, href: "/salonflow/login" },
    ] },
    { title: d.footer.cols.who, links: d.who.slice(0, 6).map((w) => ({ label: w, href: "#who" })) },
    { title: d.footer.cols.features, links: [
      { label: d.band.pills[0], href: "/salonflow/calendar" }, { label: d.band.pills[1], href: "/salonflow/book" },
      { label: d.band.pills[3], href: "/salonflow/clients" }, { label: d.band.pills[4], href: "/salonflow/memberships" },
      { label: d.band.pills[6], href: "/salonflow/messages" }, { label: d.band.pills[7], href: "/salonflow/reports" },
      { label: d.band.pills[9], href: "/salonflow/settings/calendar" }, { label: d.band.pills[8], href: "/salonflow/assistant" },
    ] },
    { title: d.footer.cols.resources, links: [
      { label: d.nav.features, href: "#features" }, { label: d.nav.why, href: "#why" },
      { label: d.nav.startFree, href: "/salonflow/signup" }, { label: d.hero.ctaSecondary, href: "/salonflow/book" },
    ] },
  ];

  return (
    <footer className="bg-[#18213d] text-white/80">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1.3fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#f0a8c0] to-[#9a7bd6] text-sm font-bold text-white">S</span>
              <span className="font-heading text-[18px] font-bold text-white">Schedulemode</span>
            </Link>
            <p className="mt-3 max-w-[220px] text-[13px] leading-relaxed text-white/55">{d.footer.tagline}</p>
            <div className="mt-4"><LanguageSwitcher dark /></div>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#c8a8e8]">{col.title}</div>
              <ul className="space-y-2.5">
                {col.links.map((l, i) => (
                  <li key={l.label + i}>
                    <Link href={l.href} className="text-[14px] text-white/70 transition-colors hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[13px] text-white/45 sm:flex-row">
          <span>© {new Date().getFullYear()} Schedulemode. {d.footer.rights}</span>
          <span>{d.footer.builtFor}</span>
        </div>
      </div>
    </footer>
  );
}
