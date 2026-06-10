"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#who", label: "Who it's for" },
  { href: "#why", label: "Why SalonFlow" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-colors ${scrolled ? "border-b border-[#eef0f2] bg-white/90 backdrop-blur" : "bg-transparent"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#f0a8c0] to-[#9a7bd6] text-sm font-bold text-white">S</span>
          <span className="text-[17px] font-semibold tracking-tight text-[#1f2a4d]">SalonFlow</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[14px] font-medium text-[#5b6472] transition-colors hover:text-[#1f2a4d]">{l.label}</a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/salonflow" className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-[#1f2a4d] hover:bg-[#f4f5f7]">Log in</Link>
          <Link href="/salonflow/onboarding" className="flex items-center gap-1.5 rounded-lg bg-[#1f2a4d] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#28365f]">
            Start free <ArrowRight className="size-4" />
          </Link>
        </div>

        <button onClick={() => setOpen((o) => !o)} className="grid size-9 place-items-center rounded-lg text-[#1f2a4d] hover:bg-[#f4f5f7] md:hidden" aria-label="Menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#eef0f2] bg-white px-5 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#1f2a4d] hover:bg-[#f4f5f7]">{l.label}</a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-[#eef0f2] pt-3">
              <Link href="/salonflow" className="rounded-lg border border-[#e6e7e7] px-3 py-2.5 text-center text-[15px] font-medium">Log in</Link>
              <Link href="/salonflow/onboarding" className="rounded-lg bg-[#1f2a4d] px-3 py-2.5 text-center text-[15px] font-semibold text-white">Start free</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
