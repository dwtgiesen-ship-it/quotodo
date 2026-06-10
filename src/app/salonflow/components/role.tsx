"use client";

// Auth + role context. Fetches the current user (/auth/me); when logged in the
// role is the user's real role and the demo switcher is hidden. When logged out
// (public demo) the switcher lets you preview the permission matrix
// (docs/salonflow/04-api-and-auth.md).

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Role = "owner" | "manager" | "staff" | "receptionist";

export type Capability =
  | "services" | "staff" | "memberships" | "reports" | "marketing"
  | "settings" | "refunds" | "manageClients" | "viewAllSchedules";

const MATRIX: Record<Role, Capability[]> = {
  owner: ["services", "staff", "memberships", "reports", "marketing", "settings", "refunds", "manageClients", "viewAllSchedules"],
  manager: ["services", "staff", "memberships", "reports", "marketing", "settings", "refunds", "manageClients", "viewAllSchedules"],
  receptionist: ["manageClients", "viewAllSchedules"],
  staff: [],
};

export type AuthUser = { id: string; email: string; name: string; salonId: string; role: Role };

type RoleCtx = {
  role: Role;
  setRole: (r: Role) => void;
  can: (c: Capability) => boolean;
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
};
const Ctx = createContext<RoleCtx | null>(null);
const KEY = "salonflow-role";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("owner");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem(KEY)) as Role | null;
    if (saved) setRoleState(saved);
    fetch("/api/salonflow/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.user) { setUser(d.user); setRoleState(d.user.role as Role); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    try { localStorage.setItem(KEY, r); } catch { /* ignore */ }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/salonflow/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/";
  }, []);

  const can = useCallback((c: Capability) => MATRIX[role].includes(c), [role]);
  const value = useMemo(() => ({ role, setRole, can, user, loading, logout }), [role, setRole, can, user, loading, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRole(): RoleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export function Restricted({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <h2 className="font-heading text-[18px] font-semibold text-[#2c2f2e]">Not available for your role</h2>
      <p className="mt-1 text-[13px] text-[#9fa5a4]">Your role doesn&apos;t have access to this area. Switch to Owner or Manager (top-right) to view it.</p>
      {children}
    </div>
  );
}
