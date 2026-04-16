"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/utils";
import { markInvoiceAsSent, markInvoiceAsPaid } from "@/lib/actions/invoices";
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
  const [busy, setBusy] = useState<"send" | "paid" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkSent() {
    setBusy("send");
    setError(null);
    const res = await markInvoiceAsSent(invoice.id);
    if (!res.success) {
      setError(res.error || "Failed");
    }
    router.refresh();
    setBusy(null);
  }

  async function handleMarkPaid() {
    setBusy("paid");
    setError(null);
    const res = await markInvoiceAsPaid(invoice.id);
    if (!res.success) {
      setError(res.error || "Failed");
    }
    router.refresh();
    setBusy(null);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Status banners */}
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
        </div>
      )}
      {invoice.status === "sent" && (
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

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Invoice {invoice.invoice_number}
          {invoice.issued_at &&
            ` · issued ${new Date(invoice.issued_at).toLocaleDateString("nl-NL")}`}
        </p>
        <div className="flex gap-2">
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
            <Button onClick={handleMarkPaid} disabled={busy !== null}>
              {busy === "paid" ? "Marking..." : "Mark as Paid"}
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

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

      {/* Payment terms */}
      <section className="text-sm text-muted-foreground">
        Payment terms: {invoice.payment_terms} days
        {invoice.due_date && ` · Due by ${new Date(invoice.due_date).toLocaleDateString("nl-NL")}`}
      </section>

      {invoice.notes && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Notes
          </p>
          <p className="text-sm">{invoice.notes}</p>
        </section>
      )}
    </div>
  );
}
