"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar as CalendarIcon,
  CreditCard,
  LayoutGrid,
  MessageSquare,
  Scissors,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { LogOut } from "lucide-react";
import { useSalon } from "../lib/store";
import { useRole } from "./role";

const NAV = [
  { href: "/salonflow/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/salonflow/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/salonflow/clients", label: "Clients", icon: Users },
  { href: "/salonflow/services", label: "Services", icon: Scissors },
  { href: "/salonflow/memberships", label: "Memberships", icon: CreditCard },
  { href: "/salonflow/messages", label: "Messages", icon: MessageSquare },
  { href: "/salonflow/reports", label: "Reports", icon: BarChart3 },
  { href: "/salonflow/assistant", label: "Assistant", icon: Sparkles },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const { state } = useSalon();
  const { role, setRole, can, user, logout } = useRole();

  // Login / signup / invite acceptance are full-screen — no app chrome.
  if (pathname === "/salonflow/login" || pathname === "/salonflow/signup" || pathname.startsWith("/salonflow/invite")) return null;

  const visible = NAV.filter((n) => {
    if (n.href.endsWith("/reports") || n.href.endsWith("/memberships")) return can("reports");
    if (n.href.endsWith("/messages")) return can("marketing");
    return true;
  });

  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-[#1f2a4d] px-4 text-white/90">
      <div className="flex min-w-0 items-center gap-1">
        <Link href="/salonflow/dashboard" className="mr-2 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-gradient-to-br from-[#f0a8c0] to-[#9a7bd6] text-sm font-bold text-white">S</span>
          <span className="hidden font-heading text-[16px] font-bold text-white lg:inline">SalonFlow</span>
        </Link>
        <nav className="flex min-w-0 items-center overflow-x-auto">
          {visible.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${active ? "bg-white/10 text-white" : "text-white/70 hover:text-white"}`}>
                <Icon className="size-4" strokeWidth={1.75} />
                <span className="hidden xl:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link href="/salonflow/book" className="hidden items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-white/20 sm:flex">
          <LayoutGrid className="size-4" strokeWidth={1.75} /> Booking page
        </Link>
        {can("settings") && (
          <Link href="/salonflow/settings" className={`grid size-8 place-items-center rounded-md ${pathname.startsWith("/salonflow/settings") ? "bg-white/10 text-white" : "text-white/70 hover:text-white"}`}>
            <Settings className="size-[18px]" strokeWidth={1.75} />
          </Link>
        )}
        {user ? (
          <>
            <div className="ml-1 hidden items-center gap-2 md:flex">
              <div className="grid size-8 place-items-center rounded-full bg-[#5b6bb0] text-xs font-semibold text-white">{(user.name || user.email).slice(0, 2).toUpperCase()}</div>
              <div className="leading-tight">
                <div className="max-w-[140px] truncate text-[13px] font-semibold text-white">{user.name || user.email}</div>
                <div className="text-[11px] capitalize text-white/60">{user.role} · {state.settings.name}</div>
              </div>
            </div>
            <button onClick={() => logout()} title="Log out" className="grid size-8 place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white">
              <LogOut className="size-[18px]" strokeWidth={1.75} />
            </button>
          </>
        ) : (
          <>
            {/* Demo role switcher — preview the permission matrix (docs/salonflow/04) */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[12px] font-medium text-white outline-none"
              title="Demo role switcher"
            >
              <option className="text-black" value="owner">Owner</option>
              <option className="text-black" value="manager">Manager</option>
              <option className="text-black" value="staff">Staff</option>
              <option className="text-black" value="receptionist">Receptionist</option>
            </select>
            <Link href="/salonflow/login" className="rounded-md bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-white/20">Log in</Link>
          </>
        )}
      </div>
    </header>
  );
}
