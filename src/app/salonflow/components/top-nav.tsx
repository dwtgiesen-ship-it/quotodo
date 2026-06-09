"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar as CalendarIcon,
  LayoutGrid,
  Scissors,
  Sparkles,
  Users,
} from "lucide-react";
import { useSalon } from "../lib/store";

const NAV = [
  { href: "/salonflow/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/salonflow/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/salonflow/clients", label: "Clients", icon: Users },
  { href: "/salonflow/services", label: "Services", icon: Scissors },
  { href: "/salonflow/assistant", label: "Assistant", icon: Sparkles },
];

export function TopNav() {
  const pathname = usePathname();
  const { state } = useSalon();
  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-[#1f2a4d] px-4 text-white/90">
      <div className="flex items-center gap-1">
        <Link href="/salonflow/dashboard" className="mr-3 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-gradient-to-br from-[#f0a8c0] to-[#9a7bd6] text-sm font-bold text-white">
            S
          </span>
          <span className="text-[15px] font-semibold text-white">SalonFlow</span>
        </Link>
        <nav className="ml-2 flex items-center">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  active ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
                }`}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/salonflow/book"
          className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-white/20"
        >
          <LayoutGrid className="size-4" strokeWidth={1.75} />
          Booking page
        </Link>
        <div className="ml-1 flex items-center gap-2 pl-1">
          <div className="grid size-8 place-items-center rounded-full bg-[#5b6bb0] text-xs font-semibold text-white">
            AP
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-white">Andre Pearl</div>
            <div className="text-[11px] text-white/60">{state.settings.name}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
