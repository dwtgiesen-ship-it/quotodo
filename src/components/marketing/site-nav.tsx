"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "./language-switcher";

export function SiteNav({ t }: { t: Dict["nav"] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#features", label: t.features },
    { href: "#who", label: t.who },
    { href: "#why", label: t.why },
    { href: "#pricing", label: t.pricing },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-colors ${scrolled ? "border-b border-sf-line bg-sf-bg/85 backdrop-blur" : "bg-transparent"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="size-8" />
          <span className="font-heading text-[18px] tracking-tight text-sf-ink"><span className="font-bold">Schedule</span><span className="font-medium text-sf-ink2">mode</span></span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-[14px] font-medium text-sf-ink2 transition-colors hover:text-sf-ink">{l.label}</a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link href="/salonflow/login" className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-sf-ink hover:bg-sf-soft">{t.login}</Link>
          <Link href="/salonflow/signup" className="btn-accent flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold">
            {t.startFree} <ArrowRight className="size-4" />
          </Link>
        </div>

        <button onClick={() => setOpen((o) => !o)} className="grid size-9 place-items-center rounded-lg text-sf-ink hover:bg-sf-soft md:hidden" aria-label="Menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-sf-line bg-sf-bg px-5 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-sf-ink hover:bg-sf-soft">{l.label}</a>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-sf-line pt-3">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/salonflow/login" className="rounded-lg border border-sf-line px-3 py-2.5 text-center text-[15px] font-medium">{t.login}</Link>
              <Link href="/salonflow/signup" className="btn-accent rounded-full px-3 py-2.5 text-center text-[15px] font-semibold">{t.startFree}</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
