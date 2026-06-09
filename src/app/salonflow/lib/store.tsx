"use client";

// Client-side demo store for SalonFlow. Holds the full salon state in React
// context, persists to localStorage, and exposes typed mutators. In production
// these mutators map 1:1 to the REST endpoints in docs/salonflow/04-api-and-auth.md;
// here they mutate the in-browser store so the whole app is interactive without a backend.

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
  Staff,
} from "./types";

const STORAGE_KEY = "salonflow-demo-v1";

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
  // selectors
  serviceById: (id: string) => Service | undefined;
  staffById: (id: string) => Staff | undefined;
  clientById: (id: string) => Client | undefined;
  // mutators
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

export function SalonProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SalonState>(SEED);
  const [hydrated, setHydrated] = useState(false);

  // hydrate from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const serviceById = useCallback((id: string) => state.services.find((s) => s.id === id), [state.services]);
  const staffById = useCallback((id: string) => state.staff.find((s) => s.id === id), [state.staff]);
  const clientById = useCallback((id: string) => state.clients.find((c) => c.id === id), [state.clients]);

  const book = useCallback<Store["book"]>(
    (input) => {
      const svc = state.services.find((s) => s.id === input.serviceId);
      if (!svc) return { ok: false, reason: "Unknown service" };
      const end = input.start + svc.durationMin / 60;
      // conflict check: same staff, same day, overlapping time, active status
      const conflict = state.appointments.find(
        (a) =>
          a.staffId === input.staffId &&
          a.day === input.day &&
          a.status !== "cancelled" &&
          overlaps({ start: input.start, end }, a),
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
      return { ok: true, appointment };
    },
    [state.services, state.appointments],
  );

  const moveAppointment = useCallback<Store["moveAppointment"]>(
    (id, day, start) => {
      const appt = state.appointments.find((a) => a.id === id);
      if (!appt) return { ok: false, reason: "Not found" };
      const dur = appt.end - appt.start;
      const end = start + dur;
      const conflict = state.appointments.find(
        (a) =>
          a.id !== id &&
          a.staffId === appt.staffId &&
          a.day === day &&
          a.status !== "cancelled" &&
          overlaps({ start, end }, a),
      );
      if (conflict) return { ok: false, reason: "Conflict — slot is taken." };
      setState((s) => ({
        ...s,
        appointments: s.appointments.map((a) => (a.id === id ? { ...a, day, start, end } : a)),
      }));
      return { ok: true, appointment: { ...appt, day, start, end } };
    },
    [state.appointments],
  );

  const setStatus = useCallback<Store["setStatus"]>((id, status) => {
    setState((s) => ({
      ...s,
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
    }));
  }, []);

  const addClient = useCallback<Store["addClient"]>((c) => {
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
    return client;
  }, []);

  const upsertService = useCallback<Store["upsertService"]>((svc) => {
    setState((s) => {
      const exists = s.services.some((x) => x.id === svc.id);
      return {
        ...s,
        services: exists ? s.services.map((x) => (x.id === svc.id ? svc : x)) : [...s.services, svc],
      };
    });
  }, []);

  const removeService = useCallback<Store["removeService"]>((id) => {
    setState((s) => ({ ...s, services: s.services.filter((x) => x.id !== id) }));
  }, []);

  const updateSettings = useCallback<Store["updateSettings"]>((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    setState(SEED);
  }, []);

  const value = useMemo<Store>(
    () => ({
      state,
      serviceById,
      staffById,
      clientById,
      book,
      moveAppointment,
      setStatus,
      addClient,
      upsertService,
      removeService,
      updateSettings,
      reset,
    }),
    [state, serviceById, staffById, clientById, book, moveAppointment, setStatus, addClient, upsertService, removeService, updateSettings, reset],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useSalon(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useSalon must be used within SalonProvider");
  return ctx;
}
