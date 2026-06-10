import Link from "next/link";

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "Why SalonFlow", href: "#why" },
      { label: "Pricing", href: "#pricing" },
      { label: "Open the app", href: "/salonflow" },
      { label: "Take a tour", href: "/salonflow/dashboard" },
      { label: "Start free", href: "/salonflow/onboarding" },
      { label: "Log in", href: "/salonflow" },
    ],
  },
  {
    title: "Who it's for",
    links: [
      { label: "Hair salons", href: "#who" },
      { label: "Nail salons", href: "#who" },
      { label: "Barbershops", href: "#who" },
      { label: "Beauty & lash", href: "#who" },
      { label: "Spas & wellness", href: "#who" },
      { label: "Pet grooming", href: "#who" },
    ],
  },
  {
    title: "Features",
    links: [
      { label: "Calendar & scheduling", href: "/salonflow/calendar" },
      { label: "Online booking", href: "/salonflow/book" },
      { label: "Client management", href: "/salonflow/clients" },
      { label: "Memberships & loyalty", href: "/salonflow/memberships" },
      { label: "Automated messaging", href: "/salonflow/messages" },
      { label: "Reporting", href: "/salonflow/reports" },
      { label: "Calendar sync", href: "/salonflow/settings/calendar" },
      { label: "AI assistant", href: "/salonflow/assistant" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Product overview", href: "#features" },
      { label: "What's different", href: "#why" },
      { label: "Get started in 10 min", href: "/salonflow/onboarding" },
      { label: "Booking demo", href: "/salonflow/book" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#18213d] text-white/80">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1.3fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#f0a8c0] to-[#9a7bd6] text-sm font-bold text-white">S</span>
              <span className="text-[17px] font-semibold text-white">SalonFlow</span>
            </Link>
            <p className="mt-3 max-w-[220px] text-[13px] leading-relaxed text-white/55">The easiest salon software in the world. Live in 10 minutes.</p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#c8a8e8]">{col.title}</div>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[14px] text-white/70 transition-colors hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[13px] text-white/45 sm:flex-row">
          <span>© {new Date().getFullYear()} SalonFlow. Demo product.</span>
          <span>Built for nail · hair · beauty · barber · lash · spa · pet grooming</span>
        </div>
      </div>
    </footer>
  );
}
