"use client";

// Demo role switcher that enforces the production permission matrix
// (docs/salonflow/04-api-and-auth.md). In production the role comes from the
// authenticated Clerk session; here it's switchable so the matrix is visible.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Role = "owner" | "manager" | "staff" | "receptionist";

export type Capability =
  | "services"
  | "staff"
  | "memberships"
  | "reports"
  | "marketing"
  | "settings"
  | "refunds"
  | "manageClients"
  | "viewAllSchedules";

const MATRIX: Record<Role, Capability[]> = {
  owner: ["services", "staff", "memberships", "reports", "marketing", "settings", "refunds", "manageClients", "viewAllSchedules"],
  manager: ["services", "staff", "memberships", "reports", "marketing", "settings", "refunds", "manageClients", "viewAllSchedules"],
  receptionist: ["manageClients", "viewAllSchedules"],
  staff: [],
};

type RoleCtx = { role: Role; setRole: (r: Role) => void; can: (c: Capability) => boolean };
const Ctx = createContext<RoleCtx | null>(null);
const KEY = "salonflow-role";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("owner");
  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem(KEY)) as Role | null;
    if (saved) setRoleState(saved);
  }, []);
  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    try { localStorage.setItem(KEY, r); } catch { /* ignore */ }
  }, []);
  const can = useCallback((c: Capability) => MATRIX[role].includes(c), [role]);
  const value = useMemo(() => ({ role, setRole, can }), [role, setRole, can]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRole(): RoleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

/** Inline guard for UI sections a role can't access. */
export function Restricted({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <h2 className="text-[18px] font-semibold text-[#2c2f2e]">Not available for your role</h2>
      <p className="mt-1 text-[13px] text-[#9fa5a4]">Your role doesn&apos;t have access to this area. Switch to Owner or Manager (top-right) to view it.</p>
      {children}
    </div>
  );
}
