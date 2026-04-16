import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Money formatting ---

/** Format integer cents as currency string. e.g. 12350 → "€123,50" */
export function formatCents(cents: number, currency: string = "EUR"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
  }).format(amount);
}

/** Parse a decimal string to integer cents. e.g. "123.50" → 12350 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

// --- VAT calculations (all in integer cents) ---

/** Line total excl. VAT: quantity × unit_price */
export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice);
}

/** VAT amount for a single line: lineTotal × (vatRate / 100) */
export function calculateLineVAT(lineTotal: number, vatRate: number): number {
  return Math.round(lineTotal * (vatRate / 100));
}

/** Aggregate totals from line items */
export function calculateQuoteTotals(
  lineItems: { quantity: number; unit_price: number; vat_rate: number }[]
): { subtotal: number; vatAmount: number; total: number } {
  let subtotal = 0;
  let vatAmount = 0;

  for (const item of lineItems) {
    const lineTotal = calculateLineTotal(item.quantity, item.unit_price);
    subtotal += lineTotal;
    vatAmount += calculateLineVAT(lineTotal, item.vat_rate);
  }

  return {
    subtotal,
    vatAmount,
    total: subtotal + vatAmount,
  };
}

// --- Date helpers ---

/** Format ISO date string for display. e.g. "2026-04-15" → "15 april 2026" */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Get ISO date string N days from now */
export function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

/** Days between two ISO date strings (positive if b is after a) */
export function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const dateA = new Date(a);
  const dateB = new Date(b);
  dateA.setHours(0, 0, 0, 0);
  dateB.setHours(0, 0, 0, 0);
  return Math.round((dateB.getTime() - dateA.getTime()) / msPerDay);
}

/** Check if an invoice is overdue. Only applies to "sent" status. */
export function isOverdue(status: string, dueDate: string | null): boolean {
  if (status !== "sent" || !dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

/** Days past the due date. Returns 0 or positive number. */
export function daysOverdue(dueDate: string): number {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const diff = daysBetween(dueDate, todayStr);
  return Math.max(0, diff);
}
