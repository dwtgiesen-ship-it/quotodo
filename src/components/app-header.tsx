"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shirt, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <svg viewBox="0 0 64 64" className="size-7 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="14" fill="var(--accent)" />
        <rect x="14" y="22" width="36" height="28" rx="6" fill="none" stroke="var(--card)" strokeWidth="4" />
        <path d="M25 22v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" fill="none" stroke="var(--card)" strokeWidth="4" strokeLinecap="round" />
        <path d="M24 36l6 6 10-11" fill="none" stroke="var(--card)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-2xl leading-none">Kofferklaar</span>
    </span>
  );
}

const TABS = [
  { href: "/", label: "Stylist", icon: Sparkles },
  { href: "/kast", label: "Kast", icon: Shirt },
];

export function AppHeader({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        {children}
        <Link href="/" className="mr-auto">
          <Logo />
        </Link>
        <nav className="flex rounded-full border border-line bg-card p-0.5 text-sm">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition-colors",
                  active ? "bg-ink text-bg" : "text-ink2 hover:text-ink",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
