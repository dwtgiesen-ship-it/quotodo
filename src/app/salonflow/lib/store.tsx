"use client";

// Client-side store for Schedulemode, now backed by the real API.
// - Hydrates from GET /api/salonflow/state on mount (SQLite via Prisma).
// - Each mutator updates local state optimistically for instant UX, then persists
//   to the API; on failure it re-hydrates from the server (source of truth).
// The mutator signatures are unchanged, so the screens did not need rewriting.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SEED } from "./seed";
import type {
  Appointment,
  Client,
  CustomerPhoto,
  LoyaltyTransaction,
  MembershipPlan,
  MembershipUser,
  Message,
  SalonState,
  Service,
  Staff,
} from "./types";

type BookingInput = {
  day: number;
  start: number;
  serviceId: string;
  staffId: string;
  clientId: string;
  source?: Appointment["source"];
};

type BookingResult = { ok: true; appointment: Appointment } | { ok: false; reason: string };

type Store = {
  state: SalonState;
  ready: boolean;
  serviceById: (id: string) => Service | undefined;
  staffById: (id: string) => SalonState["staff"][number] | undefined;
  clientById: (id: string) => Client | undefined;
  book: (input: BookingInput) => BookingResult;
  moveAppointment: (id: string, day: number, start: number) => BookingResult;
  setStatus: (id: string, status: Appointment["status"]) => void;
  addClient: (c: Pick<Client, "firstName"> & Partial<Client>) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  upsertService: (s: Service) => void;
  removeService: (id: string) => void;
  upsertStaff: (s: Staff) => void;
  removeStaff: (id: string) => void;
  updateSettings: (patch: Partial<SalonState["settings"]>) => void;
  subscribe: (planId: string, clientId: string) => void;
  cancelMembership: (id: string) => void;
  upsertPlan: (p: MembershipPlan) => void;
  addLoyalty: (clientId: string, delta: number, reason: LoyaltyTransaction["reason"], note?: string) => void;
  toggleCampaign: (id: string, active: boolean) => void;
  sendMessage: (clientId: string, channel: Message["channel"], body: string, campaignId?: string | null) => void;
  addWaitlist: (clientId: string, serviceId: string, windowDay: number) => void;
  removeWaitlist: (id: string) => void;
  addPhoto: (clientId: string, url: string, kind: CustomerPhoto["kind"]) => void;
  reset: () => void;
};

const StoreContext = createContext<Store | null>(null);

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}

let counter = 1000;
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}-${Math.random().toString(36).slice(2, 6)}`;
}

const api = {
  async json(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok && res.status !== 409) throw new Error(`${method} ${url} -> ${res.status}`);
    return res.json();
  },
};

export function SalonProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SalonState>(SEED);
  const [ready, setReady] = useState(false);

  const hydrate = useCallback(async () => {
    try {
      const res = await fetch("/api/salonflow/state", { cache: "no-store" });
      if (res.ok) setState(await res.json());
    } catch {
      /* keep optimistic/seed state */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // fire-and-forget persistence; re-hydrate on failure so the UI never drifts from the DB
  const persist = useCallback(
    (p: Promise<unknown>) => {
      p.catch(() => hydrate());
    },
    [hydrate],
  );

  const serviceById = useCallback((id: string) => state.services.find((s) => s.id === id), [state.services]);
  const staffById = useCallback((id: string) => state.staff.find((s) => s.id === id), [state.staff]);
  const clientById = useCallback((id: string) => state.clients.find((c) => c.id === id), [state.clients]);

  const book = useCallback<Store["book"]>(
    (input) => {
      const svc = state.services.find((s) => s.id === input.serviceId);
      if (!svc) return { ok: false, reason: "Unknown service" };
      const end = input.start + svc.durationMin / 60;
      const conflict = state.appointments.find(
        (a) => a.staffId === input.staffId && a.day === input.day && a.status !== "cancelled" && overlaps({ start: input.start, end }, a),
      );
      if (conflict) return { ok: false, reason: "That time conflicts with another appointment for this staff member." };
      const appointment: Appointment = {
        id: nextId("ap"),
        day: input.day,
        start: input.start,
        end,
        serviceId: input.serviceId,
        staffId: input.staffId,
        clientId: input.clientId,
        status: "booked",
        source: input.source ?? "dashboard",
        isNew: true,
      };
      setState((s) => ({ ...s, appointments: [...s.appointments, appointment] }));
      persist(api.json("/api/salonflow/appointments", "POST", { id: appointment.id, ...input }));
      return { ok: true, appointment };
    },
    [state.services, state.appointments, persist],
  );

  const moveAppointment = useCallback<Store["moveAppointment"]>(
    (id, day, start) => {
      const appt = state.appointments.find((a) => a.id === id);
      if (!appt) return { ok: false, reason: "Not found" };
      const end = start + (appt.end - appt.start);
      const conflict = state.appointments.find(
        (a) => a.id !== id && a.staffId === appt.staffId && a.day === day && a.status !== "cancelled" && overlaps({ start, end }, a),
      );
      if (conflict) return { ok: false, reason: "Conflict — slot is taken." };
      setState((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === id ? { ...a, day, start, end } : a)) }));
      persist(api.json(`/api/salonflow/appointments/${id}`, "PATCH", { day, start }));
      return { ok: true, appointment: { ...appt, day, start, end } };
    },
    [state.appointments, persist],
  );

  const setStatus = useCallback<Store["setStatus"]>(
    (id, status) => {
      setState((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)) }));
      persist(api.json(`/api/salonflow/appointments/${id}`, "PATCH", { status }));
    },
    [persist],
  );

  const addClient = useCallback<Store["addClient"]>(
    (c) => {
      const client: Client = {
        id: nextId("cl"),
        firstName: c.firstName,
        lastName: c.lastName ?? "",
        email: c.email ?? "",
        phone: c.phone ?? "",
        notes: c.notes ?? "",
        since: c.since ?? new Date().toISOString().slice(0, 10),
        totalSpendMinor: c.totalSpendMinor ?? 0,
        loyaltyPoints: c.loyaltyPoints ?? 0,
        tier: c.tier ?? "standard",
        tags: c.tags ?? ["New"],
        profileType: c.profileType ?? "generic",
        profileData: c.profileData ?? {},
      };
      setState((s) => ({ ...s, clients: [...s.clients, client] }));
      persist(api.json("/api/salonflow/clients", "POST", client));
      return client;
    },
    [persist],
  );

  const upsertService = useCallback<Store["upsertService"]>(
    (svc) => {
      setState((s) => {
        const exists = s.services.some((x) => x.id === svc.id);
        return { ...s, services: exists ? s.services.map((x) => (x.id === svc.id ? svc : x)) : [...s.services, svc] };
      });
      persist(api.json("/api/salonflow/services", "POST", svc));
    },
    [persist],
  );

  const removeService = useCallback<Store["removeService"]>(
    (id) => {
      setState((s) => ({ ...s, services: s.services.filter((x) => x.id !== id) }));
      persist(api.json(`/api/salonflow/services/${id}`, "DELETE"));
    },
    [persist],
  );

  const updateSettings = useCallback<Store["updateSettings"]>(
    (patch) => {
      setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
      persist(api.json("/api/salonflow/settings", "PATCH", patch));
    },
    [persist],
  );

  const updateClient = useCallback<Store["updateClient"]>(
    (id, patch) => {
      setState((s) => ({ ...s, clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      persist(api.json(`/api/salonflow/clients/${id}`, "PATCH", patch));
    },
    [persist],
  );

  const upsertStaff = useCallback<Store["upsertStaff"]>(
    (st) => {
      setState((s) => {
        const exists = s.staff.some((x) => x.id === st.id);
        return { ...s, staff: exists ? s.staff.map((x) => (x.id === st.id ? st : x)) : [...s.staff, st] };
      });
      persist(api.json("/api/salonflow/staff", "POST", st));
    },
    [persist],
  );

  const removeStaff = useCallback<Store["removeStaff"]>(
    (id) => {
      setState((s) => ({ ...s, staff: s.staff.filter((x) => x.id !== id) }));
      persist(api.json(`/api/salonflow/staff/${id}`, "DELETE"));
    },
    [persist],
  );

  const subscribe = useCallback<Store["subscribe"]>(
    (planId, clientId) => {
      const m: MembershipUser = { id: nextId("mu"), planId, clientId, status: "active", renewsAt: null };
      setState((s) => ({ ...s, memberships: [...s.memberships, m] }));
      persist(api.json("/api/salonflow/memberships", "POST", { id: m.id, planId, clientId }));
    },
    [persist],
  );

  const cancelMembership = useCallback<Store["cancelMembership"]>(
    (id) => {
      setState((s) => ({ ...s, memberships: s.memberships.map((m) => (m.id === id ? { ...m, status: "cancelled" } : m)) }));
      persist(api.json(`/api/salonflow/memberships/${id}`, "DELETE"));
    },
    [persist],
  );

  const upsertPlan = useCallback<Store["upsertPlan"]>(
    (p) => {
      setState((s) => {
        const exists = s.membershipPlans.some((x) => x.id === p.id);
        return { ...s, membershipPlans: exists ? s.membershipPlans.map((x) => (x.id === p.id ? p : x)) : [...s.membershipPlans, p] };
      });
      persist(api.json("/api/salonflow/membership-plans", "POST", p));
    },
    [persist],
  );

  const addLoyalty = useCallback<Store["addLoyalty"]>(
    (clientId, delta, reason, note = "") => {
      const t: LoyaltyTransaction = { id: nextId("lt"), clientId, delta, reason, note, createdAt: new Date().toISOString().slice(0, 10) };
      setState((s) => ({
        ...s,
        loyaltyLedger: [t, ...s.loyaltyLedger],
        clients: s.clients.map((c) => (c.id === clientId ? { ...c, loyaltyPoints: c.loyaltyPoints + delta } : c)),
      }));
      persist(api.json("/api/salonflow/loyalty", "POST", { id: t.id, clientId, delta, reason, note }));
    },
    [persist],
  );

  const toggleCampaign = useCallback<Store["toggleCampaign"]>(
    (id, active) => {
      setState((s) => ({ ...s, campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, active } : c)) }));
      persist(api.json(`/api/salonflow/campaigns/${id}`, "PATCH", { active }));
    },
    [persist],
  );

  const sendMessage = useCallback<Store["sendMessage"]>(
    (clientId, channel, body, campaignId = null) => {
      const m: Message = { id: nextId("msg"), campaignId, clientId, channel, status: "sent", body, createdAt: new Date().toISOString().slice(0, 10) };
      setState((s) => ({ ...s, messages: [m, ...s.messages] }));
      persist(api.json("/api/salonflow/messages", "POST", { id: m.id, clientId, channel, body, campaignId }));
    },
    [persist],
  );

  const addWaitlist = useCallback<Store["addWaitlist"]>(
    (clientId, serviceId, windowDay) => {
      const w = { id: nextId("wl"), clientId, serviceId, windowDay, filledAt: null };
      setState((s) => ({ ...s, waitlist: [...s.waitlist, w] }));
      persist(api.json("/api/salonflow/waitlist", "POST", { id: w.id, clientId, serviceId, windowDay }));
    },
    [persist],
  );

  const removeWaitlist = useCallback<Store["removeWaitlist"]>(
    (id) => {
      setState((s) => ({ ...s, waitlist: s.waitlist.filter((w) => w.id !== id) }));
      persist(api.json(`/api/salonflow/waitlist/${id}`, "DELETE"));
    },
    [persist],
  );

  const addPhoto = useCallback<Store["addPhoto"]>(
    (clientId, url, kind) => {
      const p: CustomerPhoto = { id: nextId("ph"), clientId, url, kind };
      setState((s) => ({ ...s, photos: [...s.photos, p] }));
      persist(api.json("/api/salonflow/photos", "POST", { id: p.id, clientId, url, kind }));
    },
    [persist],
  );

  const reset = useCallback(() => hydrate(), [hydrate]);

  const value = useMemo<Store>(
    () => ({ state, ready, serviceById, staffById, clientById, book, moveAppointment, setStatus, addClient, updateClient, upsertService, removeService, upsertStaff, removeStaff, updateSettings, subscribe, cancelMembership, upsertPlan, addLoyalty, toggleCampaign, sendMessage, addWaitlist, removeWaitlist, addPhoto, reset }),
    [state, ready, serviceById, staffById, clientById, book, moveAppointment, setStatus, addClient, updateClient, upsertService, removeService, upsertStaff, removeStaff, updateSettings, subscribe, cancelMembership, upsertPlan, addLoyalty, toggleCampaign, sendMessage, addWaitlist, removeWaitlist, addPhoto, reset],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useSalon(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSalon must be used within SalonProvider");
  return ctx;
}
