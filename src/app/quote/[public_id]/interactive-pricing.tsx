"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCents, calculateQuoteTotals } from "@/lib/utils";
import {
  acceptAndCreateInvoice,
  getDepositInfoForQuote,
  rejectQuote,
  type AcceptAndInvoiceResult,
} from "@/lib/actions/public-quote";
import type { QuoteLineItem } from "@/types";

type Status = "draft" | "sent" | "accepted" | "rejected";

interface Props {
  publicId: string;
  currency: string;
  items: QuoteLineItem[];
  status: Status;
  acceptedAt: string | null;
  rejectedAt: string | null;
  acceptedSelection: string[] | null;
  acceptedTotal: number | null;
  accent: string;
}

interface DepositState extends AcceptAndInvoiceResult {
  depositPaid: boolean;
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function InteractivePricing({
  publicId,
  currency,
  items,
  status,
  acceptedAt,
  rejectedAt,
  acceptedSelection,
  acceptedTotal,
  accent,
}: Props) {
  const router = useRouter();
  const isFinalized = status === "accepted" || status === "rejected";

  const initialSelection = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const li of items) {
      const isOptional = li.optional ?? false;
      if (!isOptional) {
        map[li.id] = true;
      } else if (status === "accepted" && acceptedSelection) {
        map[li.id] = acceptedSelection.includes(li.id);
      } else {
        map[li.id] = li.default_selected ?? true;
      }
    }
    return map;
  }, [items, status, acceptedSelection]);

  const [selection, setSelection] = useState<Record<string, boolean>>(initialSelection);
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deposit, setDeposit] = useState<DepositState | null>(null);

  // Load deposit info for already-accepted quotes
  useEffect(() => {
    if (status === "accepted") {
      getDepositInfoForQuote(publicId).then((res) => {
        if (res.success && res.data) {
          setDeposit(res.data);
        }
      });
    }
  }, [status, publicId]);

  const requiredItems = items.filter((li) => !(li.optional ?? false));
  const optionalItems = items.filter((li) => li.optional ?? false);

  const activeItems = items.filter((li) => selection[li.id]);
  const totals = useMemo(
    () => calculateQuoteTotals(activeItems),
    [activeItems]
  );

  function toggle(id: string) {
    if (isFinalized) return;
    setSelection((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleAccept() {
    setBusy("accept");
    setError(null);
    const selectedIds = Object.entries(selection)
      .filter(([, v]) => v)
      .map(([id]) => id);
    const res = await acceptAndCreateInvoice(publicId, selectedIds, totals.total);
    setBusy(null);
    if (!res.success || !res.data) {
      setError(res.error || "Failed to accept");
      return;
    }
    setDeposit({ ...res.data, depositPaid: false });
    router.refresh();
  }

  async function handleReject() {
    if (!confirm("Are you sure you want to decline this quote?")) return;
    setBusy("reject");
    setError(null);
    const res = await rejectQuote(publicId);
    setBusy(null);
    if (!res.success) {
      setError(res.error || "Failed to decline");
      return;
    }
    router.refresh();
  }

  const displayTotal = status === "accepted" && acceptedTotal !== null ? acceptedTotal : totals.total;
  const displaySubtotal = totals.subtotal;
  const displayVat = totals.vatAmount;

  return (
    <>
      {/* Required items */}
      {requiredItems.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: accent }}>
            Pricing
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2" style={{ borderColor: accent }}>
                <th className="text-left pb-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
                <th className="text-right pb-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-16">
                  Qty
                </th>
                <th className="text-right pb-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">
                  Price
                </th>
                <th className="text-right pb-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {requiredItems.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">{formatCents(item.unit_price, currency)}</td>
                  <td className="py-3 text-right">
                    {formatCents(item.line_total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Optional add-ons */}
      {optionalItems.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: accent }}>
            Optional add-ons
          </h2>
          <div className="space-y-2">
            {optionalItems.map((item) => {
              const isSelected = !!selection[item.id];
              return (
                <label
                  key={item.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    isFinalized
                      ? isSelected
                        ? "bg-muted/30"
                        : "opacity-50"
                      : isSelected
                      ? "bg-muted/30 cursor-pointer"
                      : "hover:bg-muted/20 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isFinalized}
                      onChange={() => toggle(item.id)}
                      className="h-4 w-4"
                      style={{ accentColor: accent }}
                    />
                    <div>
                      <p className="text-sm font-medium">{item.description}</p>
                      {item.quantity !== 1 && (
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatCents(item.unit_price, currency)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium">
                    + {formatCents(item.line_total, currency)}
                  </p>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* Totals */}
      <section>
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="transition-all">{formatCents(displaySubtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT</span>
              <span className="transition-all">{formatCents(displayVat, currency)}</span>
            </div>
            <div
              className="flex justify-between pt-2 border-t-2 font-bold text-lg"
              style={{ borderColor: accent, color: accent }}
            >
              <span>Total</span>
              <span className="transition-all">{formatCents(displayTotal, currency)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Selection summary */}
      {optionalItems.length > 0 && !isFinalized && (
        <section className="bg-muted/30 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Your selection
          </p>
          <ul className="text-sm space-y-1">
            {activeItems.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>• {item.description}</span>
                <span className="text-muted-foreground">
                  {formatCents(item.line_total, currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Accept / Reject OR deposit screen */}
      <div className="border-t pt-8">
        {/* Deposit screen — shown after accept if we have invoice info */}
        {status === "accepted" && deposit && (
          <div
            className={`rounded-lg p-6 space-y-4 border ${
              deposit.depositPaid
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            {deposit.depositPaid ? (
              <>
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-800 mb-1">
                    ✓ Deposit received — order confirmed
                  </p>
                  <p className="text-sm text-green-700">
                    Thank you! {deposit.companyName} will be in touch.
                  </p>
                </div>
                <div className="text-xs text-green-700 text-center pt-2 border-t border-green-200">
                  Invoice {deposit.invoiceNumber} · Deposit{" "}
                  {formatCents(deposit.depositAmount, deposit.currency)} of{" "}
                  {formatCents(deposit.total, deposit.currency)} total
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-lg font-semibold text-amber-900 mb-1">
                    Awaiting deposit payment
                  </p>
                  <p className="text-sm text-amber-800">
                    To confirm your order, please complete the deposit payment below.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 space-y-3 border border-amber-100">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm text-muted-foreground">
                      Deposit ({deposit.depositPercent}%)
                    </p>
                    <p className="text-2xl font-bold" style={{ color: accent }}>
                      {formatCents(deposit.depositAmount, deposit.currency)}
                    </p>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Remaining balance</span>
                    <span>
                      {formatCents(
                        deposit.total - deposit.depositAmount,
                        deposit.currency
                      )}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 space-y-2 border border-amber-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment instructions
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beneficiary</span>
                      <span className="font-medium">{deposit.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IBAN</span>
                      <span className="font-mono font-medium">{deposit.companyIban}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium">
                        {formatCents(deposit.depositAmount, deposit.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-mono font-medium">
                        {deposit.invoiceNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-amber-800 text-center">
                  Please complete payment to confirm your order. This page will update
                  once we receive your deposit.
                </p>
              </>
            )}
          </div>
        )}

        {/* Accepted but no invoice info (legacy) */}
        {status === "accepted" && !deposit && (
          <div
            className="rounded-lg p-6 text-center"
            style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", borderWidth: 1 }}
          >
            <p className="text-base font-semibold text-green-800 mb-1">
              Quote accepted — thank you!
            </p>
            {acceptedAt && (
              <p className="text-sm text-green-700">
                Accepted on {formatDateTime(acceptedAt)}
              </p>
            )}
          </div>
        )}

        {status === "rejected" && (
          <div
            className="rounded-lg p-6 text-center"
            style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", borderWidth: 1 }}
          >
            <p className="text-base font-semibold text-red-800 mb-1">Quote declined</p>
            {rejectedAt && (
              <p className="text-sm text-red-700">Declined on {formatDateTime(rejectedAt)}</p>
            )}
          </div>
        )}

        {!isFinalized && (
          <>
            <p className="text-sm text-center text-muted-foreground mb-4">
              Review your selection and confirm your order.
            </p>

            {error && <p className="text-sm text-center text-red-600 mb-4">{error}</p>}

            <div className="flex gap-3 justify-center">
              <Button
                size="lg"
                onClick={handleAccept}
                disabled={busy !== null}
                style={{ backgroundColor: accent, borderColor: accent }}
              >
                {busy === "accept" ? "Accepting..." : "Accept & Pay Deposit"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleReject}
                disabled={busy !== null}
              >
                {busy === "reject" ? "Declining..." : "Decline"}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
