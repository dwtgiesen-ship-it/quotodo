"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCents, isOverdue, daysOverdue } from "@/lib/utils";
import {
  markInvoiceAsSent,
  markInvoiceAsPaid,
  markDepositAsPaid,
  getReminderTextsForInvoice,
} from "@/lib/actions/invoices";
import type { Invoice } from "@/types";

export function InvoiceView({
  invoice,
  brandColor,
}: {
  invoice: Invoice;
  brandColor: string | null;
}) {
  const router = useRouter();
  const accent = brandColor || "#111111";
  const [busy, setBusy] = useState<"send" | "paid" | "deposit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Payment modal state
  const [paidModalOpen, setPaidModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "cash" | "other">(
    "bank_transfer"
  );
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Reminder state
  const [reminderBusy, setReminderBusy] = useState<"email" | "whatsapp" | null>(null);
  const [reminderCopied, setReminderCopied] = useState<"email" | "whatsapp" | null>(null);

  const overdue = isOverdue(invoice.status, invoice.due_date);
  const overdueDays = invoice.due_date && overdue ? daysOverdue(invoice.due_date) : 0;

  async function handleMarkDepositPaid() {
    setBusy("deposit");
    setError(null);
    const res = await markDepositAsPaid(invoice.id);
    if (!res.success) setError(res.error || "Failed");
    router.refresh();
    setBusy(null);
  }

  async function handleMarkSent() {
    setBusy("send");
    setError(null);
    const res = await markInvoiceAsSent(invoice.id);
    if (!res.success) setError(res.error || "Failed");
    router.refresh();
    setBusy(null);
  }

  async function handleConfirmPaid() {
    setBusy("paid");
    setError(null);
    const res = await markInvoiceAsPaid(invoice.id, {
      paymentMethod,
      paymentReference: paymentReference || undefined,
      notes: paymentNotes || undefined,
    });
    if (!res.success) {
      setError(res.error || "Failed");
      setBusy(null);
      return;
    }
    setPaidModalOpen(false);
    router.refresh();
    setBusy(null);
  }

  async function handleCopyReminder(kind: "email" | "whatsapp") {
    setReminderBusy(kind);
    const res = await getReminderTextsForInvoice(invoice.id);
    setReminderBusy(null);
    if (!res.success || !res.data) {
      setError(res.error || "Failed to generate reminder");
      return;
    }
    const text = kind === "email" ? res.data.emailFull : res.data.whatsapp;
    try {
      await navigator.clipboard.writeText(text);
      setReminderCopied(kind);
      setTimeout(() => setReminderCopied(null), 2000);
    } catch {
      prompt("Copy this reminder:", text);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Status banners */}
      {overdue && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-semibold text-red-800">
            Payment overdue by {overdueDays} day{overdueDays === 1 ? "" : "s"}
          </p>
          {invoice.due_date && (
            <p className="text-xs text-red-700 mt-1">
              Was due on {new Date(invoice.due_date).toLocaleDateString("nl-NL")}
            </p>
          )}
        </div>
      )}
      {invoice.status === "paid" && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-semibold text-green-800">
            ✓ Paid
            {invoice.paid_at &&
              ` on ${new Date(invoice.paid_at).toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}`}
          </p>
          {(invoice.payment_method || invoice.payment_reference) && (
            <p className="text-xs text-green-700 mt-1">
              {invoice.payment_method && (
                <>
                  via{" "}
                  {invoice.payment_method === "bank_transfer"
                    ? "bank transfer"
                    : invoice.payment_method}
                </>
              )}
              {invoice.payment_reference && ` · ref ${invoice.payment_reference}`}
            </p>
          )}
        </div>
      )}
      {invoice.status === "sent" && !overdue && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm font-semibold text-blue-800">
            Sent — waiting for payment
          </p>
          {invoice.due_date && (
            <p className="text-xs text-blue-700 mt-1">
              Due by {new Date(invoice.due_date).toLocaleDateString("nl-NL")}
            </p>
          )}
        </div>
      )}

      {/* Deposit status */}
      {invoice.deposit_amount > 0 && (
        <div
          className={`rounded-lg p-4 border ${
            invoice.deposit_paid
              ? "bg-green-50 border-green-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className={`text-sm font-semibold ${
                  invoice.deposit_paid ? "text-green-800" : "text-amber-900"
                }`}
              >
                {invoice.deposit_paid
                  ? "✓ Deposit paid"
                  : `Deposit required (${invoice.deposit_required_percent}%)`}
              </p>
              <p
                className={`text-xs mt-1 ${
                  invoice.deposit_paid ? "text-green-700" : "text-amber-800"
                }`}
              >
                {formatCents(invoice.deposit_amount, invoice.currency)} of{" "}
                {formatCents(invoice.total, invoice.currency)} total
                {invoice.deposit_paid &&
                  invoice.deposit_paid_at &&
                  ` · paid on ${new Date(invoice.deposit_paid_at).toLocaleDateString(
                    "nl-NL"
                  )}`}
                {!invoice.deposit_paid && (
                  <>
                    {" · Remaining balance "}
                    {formatCents(
                      invoice.total - invoice.deposit_amount,
                      invoice.currency
                    )}
                  </>
                )}
              </p>
            </div>
            {!invoice.deposit_paid && (
              <Button
                size="sm"
                onClick={handleMarkDepositPaid}
                disabled={busy !== null}
              >
                {busy === "deposit" ? "Marking..." : "Mark Deposit as Paid"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Invoice {invoice.invoice_number}
          {invoice.issued_at &&
            ` · issued ${new Date(invoice.issued_at).toLocaleDateString("nl-NL")}`}
        </p>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" onClick={() => router.push("/invoices")}>
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`/api/pdf/invoice/${invoice.id}`, "_blank")}
          >
            PDF
          </Button>
          {invoice.status === "draft" && (
            <Button onClick={handleMarkSent} disabled={busy !== null}>
              {busy === "send" ? "Marking..." : "Mark as Sent"}
            </Button>
          )}
          {invoice.status === "sent" && (
            <Button onClick={() => setPaidModalOpen(true)}>Mark as Paid</Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Reminder section */}
      {invoice.status === "sent" && (
        <div
          className={`border rounded-lg p-4 space-y-3 ${
            overdue ? "bg-red-50/50 border-red-200" : "bg-muted/30"
          }`}
        >
          <div>
            <p className="text-sm font-semibold">
              {overdue ? "Follow up on overdue payment" : "Send a payment reminder"}
            </p>
            <p className="text-xs text-muted-foreground">
              Copy a pre-written message and send via your own email or WhatsApp.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleCopyReminder("email")}
              disabled={reminderBusy !== null}
            >
              {reminderCopied === "email"
                ? "Copied!"
                : reminderBusy === "email"
                ? "Loading..."
                : "Copy Reminder (Email)"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCopyReminder("whatsapp")}
              disabled={reminderBusy !== null}
            >
              {reminderCopied === "whatsapp"
                ? "Copied!"
                : reminderBusy === "whatsapp"
                ? "Loading..."
                : "Copy Reminder (WhatsApp)"}
            </Button>
          </div>
        </div>
      )}

      {/* Mark as Paid modal */}
      {paidModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Mark as Paid</h3>
              <p className="text-sm text-muted-foreground">
                Optional: record how the payment was received.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Payment method</Label>
              <select
                id="method"
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "bank_transfer" | "cash" | "other")
                }
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="bank_transfer">Bank transfer</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction ID or description (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pnotes">Notes</Label>
              <Textarea
                id="pnotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Any additional info (optional)"
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setPaidModalOpen(false)}
                disabled={busy === "paid"}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmPaid} disabled={busy === "paid"}>
                {busy === "paid" ? "Saving..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: accent }}>
          {invoice.title || invoice.invoice_number}
        </h1>
      </div>

      {/* Client */}
      {(invoice.client_name || invoice.client_email) && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Billed to
          </p>
          {invoice.client_name && <p className="font-semibold">{invoice.client_name}</p>}
          {invoice.client_email && (
            <p className="text-sm text-muted-foreground">{invoice.client_email}</p>
          )}
        </section>
      )}

      {/* Line items */}
      <section>
        <h2 className="text-lg font-semibold mb-2" style={{ color: accent }}>
          Line items
        </h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left pb-2 font-medium">Description</th>
              <th className="text-right pb-2 font-medium w-16">Qty</th>
              <th className="text-right pb-2 font-medium w-24">Unit</th>
              <th className="text-right pb-2 font-medium w-28">Price</th>
              <th className="text-right pb-2 font-medium w-16">VAT</th>
              <th className="text-right pb-2 font-medium w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((item, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-3">{item.description}</td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-right text-muted-foreground">{item.unit}</td>
                <td className="py-3 text-right">
                  {formatCents(item.unit_price, invoice.currency)}
                </td>
                <td className="py-3 text-right text-muted-foreground">{item.vat_rate}%</td>
                <td className="py-3 text-right">
                  {formatCents(item.line_total, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCents(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT</span>
              <span>{formatCents(invoice.vat_amount, invoice.currency)}</span>
            </div>
            <div
              className="flex justify-between pt-2 border-t-2 font-bold text-base"
              style={{ borderColor: accent, color: accent }}
            >
              <span>Total</span>
              <span>{formatCents(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="text-sm text-muted-foreground">
        Payment terms: {invoice.payment_terms} days
        {invoice.due_date && ` · Due by ${new Date(invoice.due_date).toLocaleDateString("nl-NL")}`}
      </section>

      {invoice.notes && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Notes
          </p>
          <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
        </section>
      )}
    </div>
  );
}
