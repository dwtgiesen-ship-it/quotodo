"use client";

// Client-side store for SalonFlow, now backed by the real API.
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
  SalonState,
  Service,
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
  upsertService: (s: Service) => void;
  removeService: (id: string) => void;
  updateSettings: (patch: Partial<SalonState["settings"]>) => void;
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

  const reset = useCallback(() => hydrate(), [hydrate]);

  const value = useMemo<Store>(
    () => ({ state, ready, serviceById, staffById, clientById, book, moveAppointment, setStatus, addClient, upsertService, removeService, updateSettings, reset }),
    [state, ready, serviceById, staffById, clientById, book, moveAppointment, setStatus, addClient, upsertService, removeService, updateSettings, reset],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useSalon(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSalon must be used within SalonProvider");
  return ctx;
}
