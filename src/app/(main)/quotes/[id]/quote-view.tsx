"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCents, calculateQuoteTotals, toCents } from "@/lib/utils";
import Link from "next/link";
import { updateQuote, sendQuoteByEmail, markQuoteAsSent } from "@/lib/actions/quotes";
import { createInvoiceFromQuote } from "@/lib/actions/invoices";
import type { Quote, QuoteLineItem, QuoteVersion } from "@/types";

interface EditableLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number; // cents
  vat_rate: number;
  sort_order: number;
  optional: boolean;
  default_selected: boolean;
}

export function QuoteView({
  quote,
  lineItems,
  brandColor,
  versions,
}: {
  quote: Quote;
  lineItems: QuoteLineItem[];
  brandColor: string | null;
  versions: QuoteVersion[];
}) {
  const accent = brandColor || "#111111";
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(quote.client_email ?? "");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ kind: "success" | "error"; msg: string } | null>(
    null
  );
  const [markingSent, setMarkingSent] = useState(false);
  const [converting, setConverting] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/quote/${quote.public_id}`
      : `/quote/${quote.public_id}`;

  async function handleConvertToInvoice() {
    setConverting(true);
    setError(null);

    const res = await createInvoiceFromQuote(quote.id);

    if (!res.success || !res.data) {
      setError(res.error || "Failed to create invoice");
      setConverting(false);
      return;
    }

    router.push(`/invoices/${res.data.id}`);
  }

  async function handleMarkAsSent() {
    setMarkingSent(true);
    setError(null);

    const res = await markQuoteAsSent(quote.id);

    if (!res.success) {
      setError(res.error || "Failed to mark as sent");
      setMarkingSent(false);
      return;
    }

    router.refresh();
    setMarkingSent(false);
  }

  async function handleSend() {
    setSending(true);
    setSendResult(null);

    const res = await sendQuoteByEmail(quote.id, sendEmail);

    setSending(false);

    if (!res.success) {
      setSendResult({ kind: "error", msg: res.error || "Send failed" });
      return;
    }

    setSendResult({ kind: "success", msg: `Email sent to ${sendEmail}` });
    setTimeout(() => {
      setSendOpen(false);
      setSendResult(null);
      router.refresh();
    }, 1500);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
      prompt("Copy this link:", publicUrl);
    }
  }

  const [title, setTitle] = useState(quote.title);
  const [summary, setSummary] = useState(quote.summary ?? "");
  const [timeline, setTimeline] = useState(quote.timeline ?? "");
  const [items, setItems] = useState<EditableLineItem[]>(
    lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      unit: li.unit,
      unit_price: li.unit_price,
      vat_rate: li.vat_rate,
      sort_order: li.sort_order,
      optional: li.optional,
      default_selected: li.default_selected,
    }))
  );

  // Totals reflect default selection in the editor
  const totals = calculateQuoteTotals(
    items.filter((li) => !li.optional || li.default_selected)
  );

  function updateItem(
    index: number,
    field: keyof EditableLineItem,
    value: string | number | boolean
  ) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        description: "",
        quantity: 1,
        unit: "per stuk",
        unit_price: 0,
        vat_rate: 21,
        sort_order: prev.length,
        optional: false,
        default_selected: true,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const res = await updateQuote({
      id: quote.id,
      title,
      summary,
      timeline,
      line_items: items,
    });

    setSaving(false);

    if (!res.success) {
      setError(res.error || "Save failed");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setTitle(quote.title);
    setSummary(quote.summary ?? "");
    setTimeline(quote.timeline ?? "");
    setItems(
      lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        quantity: li.quantity,
        unit: li.unit,
        unit_price: li.unit_price,
        vat_rate: li.vat_rate,
        sort_order: li.sort_order,
        optional: li.optional,
        default_selected: li.default_selected,
      }))
    );
    setEditing(false);
    setError(null);
  }

  // Only rejected quotes are locked. Sent/accepted quotes can be edited —
  // which creates a new version and resets status to draft.
  const isLocked = quote.status === "rejected";
  const needsRevisionWarning =
    quote.status === "sent" || quote.status === "accepted";

  // Client-selected options on accepted quote
  const hasOptionalItems = lineItems.some((li) => li.optional);
  const selectedLineItems = quote.accepted_selection
    ? lineItems.filter((li) => quote.accepted_selection!.includes(li.id))
    : lineItems.filter((li) => !li.optional || li.default_selected);
  const skippedOptional = quote.accepted_selection
    ? lineItems.filter(
        (li) => li.optional && !quote.accepted_selection!.includes(li.id)
      )
    : [];

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Status banner for accepted/rejected */}
      {quote.status === "accepted" && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-green-800">
              ✓ Accepted by client
              {quote.accepted_at &&
                ` on ${new Date(quote.accepted_at).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`}
            </p>
            <p className="text-xs text-green-700 mt-1">
              Editing is locked. Ready to bill?
            </p>
          </div>
          <Button onClick={handleConvertToInvoice} disabled={converting}>
            {converting ? "Creating..." : "Convert to Invoice"}
          </Button>
        </div>
      )}

      {/* Client-selected options — only show when accepted AND had optional items */}
      {quote.status === "accepted" && hasOptionalItems && quote.accepted_selection && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <p className="text-sm font-semibold mb-2">Client selected options</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Included
              </p>
              <ul className="text-sm space-y-0.5">
                {selectedLineItems.map((li) => (
                  <li key={li.id}>
                    ✓ {li.description}
                    {li.optional && (
                      <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {skippedOptional.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Declined
                </p>
                <ul className="text-sm space-y-0.5 text-muted-foreground">
                  {skippedOptional.map((li) => (
                    <li key={li.id}>✕ {li.description}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {quote.accepted_total !== null && (
            <p className="text-xs text-muted-foreground mt-3">
              Accepted total: {(quote.accepted_total / 100).toLocaleString("nl-NL", { style: "currency", currency: quote.currency })}
            </p>
          )}
        </div>
      )}

      {quote.status === "rejected" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-semibold text-red-800">
            Declined by client
            {quote.rejected_at &&
              ` on ${new Date(quote.rejected_at).toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}`}
          </p>
          <p className="text-xs text-red-700 mt-1">
            Editing is locked. Create a new quote if you want to start fresh.
          </p>
        </div>
      )}
      {quote.status === "sent" && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm font-semibold text-blue-800">
            Sent — waiting for client response
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Share the public link with your client. They can accept or decline directly.
          </p>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Quote {quote.quote_number} · v{quote.current_version} ·{" "}
          {new Date(quote.created_at).toLocaleDateString("nl-NL")}
        </p>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Back
              </Button>
              <Button variant="outline" onClick={handleCopyLink}>
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`/api/pdf/quote/${quote.id}`, "_blank")}
              >
                PDF
              </Button>
              {quote.status === "draft" && (
                <Button
                  variant="outline"
                  onClick={handleMarkAsSent}
                  disabled={markingSent}
                >
                  {markingSent ? "Marking..." : "Mark as Sent"}
                </Button>
              )}
              {!isLocked && (
                <Button onClick={() => setSendOpen((v) => !v)}>
                  Send to Client
                </Button>
              )}
              {!isLocked && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Revision warning when editing an accepted/rejected quote */}
      {editing && needsRevisionWarning && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Creating new revision
          </p>
          <p className="text-xs text-amber-800 mt-1">
            Saving changes will create version {quote.current_version + 1} and reset the
            status to draft. The current snapshot will be kept in history.
          </p>
        </div>
      )}

      {/* Editing banner — just says what version you're editing */}
      {editing && !needsRevisionWarning && (
        <p className="text-xs text-muted-foreground">
          Editing version {quote.current_version}
        </p>
      )}

      {/* Send to Client inline form */}
      {sendOpen && !editing && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <div>
            <p className="text-sm font-semibold mb-1">Send quote to client</p>
            <p className="text-xs text-muted-foreground">
              The client will receive an email with a link to view and accept this quote.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="client@example.com"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              disabled={sending}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={sending || !sendEmail}>
              {sending ? "Sending..." : "Send Email"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSendOpen(false);
                setSendResult(null);
              }}
              disabled={sending}
            >
              Cancel
            </Button>
          </div>
          {sendResult && (
            <p
              className={`text-sm ${
                sendResult.kind === "success" ? "text-green-700" : "text-destructive"
              }`}
            >
              {sendResult.msg}
            </p>
          )}
        </div>
      )}

      {/* Title */}
      {editing ? (
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-3xl font-bold h-auto py-2"
        />
      ) : (
        <h1 className="text-3xl font-bold" style={{ color: accent }}>
          {quote.title}
        </h1>
      )}

      {quote.client_name && (
        <p className="text-muted-foreground">for {quote.client_name}</p>
      )}

      {/* Summary */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        {editing ? (
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
        ) : (
          <p className="text-sm">{quote.summary || "—"}</p>
        )}
      </section>

      {/* Included */}
      {quote.scope_included.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Included</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {quote.scope_included.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Timeline */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Timeline</h2>
        {editing ? (
          <Input value={timeline} onChange={(e) => setTimeline(e.target.value)} />
        ) : (
          <p className="text-sm">{quote.timeline || "—"}</p>
        )}
      </section>

      {/* Pricing */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Pricing</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left pb-2 font-medium">Description</th>
              <th className="text-right pb-2 font-medium w-20">Qty</th>
              <th className="text-right pb-2 font-medium w-28">Unit</th>
              <th className="text-right pb-2 font-medium w-32">Price</th>
              <th className="text-right pb-2 font-medium w-32">Line total</th>
              {editing && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b last:border-0 align-middle">
                <td className="py-2">
                  {editing ? (
                    <div className="space-y-1">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(i, "description", e.target.value)}
                      />
                      <div className="flex gap-3 text-xs">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.optional}
                            onChange={(e) =>
                              updateItem(i, "optional", e.target.checked)
                            }
                          />
                          <span className="text-muted-foreground">Optional</span>
                        </label>
                        {item.optional && (
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.default_selected}
                              onChange={(e) =>
                                updateItem(i, "default_selected", e.target.checked)
                              }
                            />
                            <span className="text-muted-foreground">
                              Selected by default
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {item.description}
                      {item.optional && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          Optional{!item.default_selected && " · opt-in"}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-2 text-right">
                  {editing ? (
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                      className="text-right"
                    />
                  ) : (
                    item.quantity
                  )}
                </td>
                <td className="py-2 text-right">
                  {editing ? (
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(i, "unit", e.target.value)}
                    />
                  ) : (
                    item.unit
                  )}
                </td>
                <td className="py-2 text-right">
                  {editing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price / 100}
                      onChange={(e) =>
                        updateItem(i, "unit_price", toCents(parseFloat(e.target.value) || 0))
                      }
                      className="text-right"
                    />
                  ) : (
                    formatCents(item.unit_price)
                  )}
                </td>
                <td className="py-2 text-right">
                  {formatCents(Math.round(item.quantity * item.unit_price))}
                </td>
                {editing && (
                  <td className="py-2 text-right">
                    <button
                      onClick={() => removeItem(i)}
                      className="text-destructive text-xs hover:underline"
                      type="button"
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={editing ? 5 : 4} className="pt-3 text-right text-sm">
                Subtotal
              </td>
              <td className="pt-3 text-right text-sm">{formatCents(totals.subtotal)}</td>
              {editing && <td></td>}
            </tr>
            <tr>
              <td colSpan={editing ? 5 : 4} className="text-right text-sm text-muted-foreground">
                VAT
              </td>
              <td className="text-right text-sm text-muted-foreground">
                {formatCents(totals.vatAmount)}
              </td>
              {editing && <td></td>}
            </tr>
            <tr className="border-t">
              <td
                colSpan={editing ? 5 : 4}
                className="pt-2 text-right font-semibold"
                style={{ color: accent }}
              >
                Total
              </td>
              <td className="pt-2 text-right font-semibold" style={{ color: accent }}>
                {formatCents(totals.total)}
              </td>
              {editing && <td></td>}
            </tr>
          </tfoot>
        </table>

        {editing && (
          <Button variant="outline" size="sm" onClick={addItem} className="mt-3">
            + Add line item
          </Button>
        )}
      </section>

      {/* Version history */}
      {versions.length > 1 && !editing && (
        <section className="pt-6 border-t">
          <h2 className="text-lg font-semibold mb-3">Version History</h2>
          <div className="space-y-2">
            {versions.map((v) => {
              const isCurrent = v.version_number === quote.current_version;
              return (
                <div
                  key={v.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    isCurrent ? "bg-muted/30" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">
                      Version {v.version_number}
                      {isCurrent && (
                        <span
                          className="ml-2 text-xs px-2 py-0.5 rounded"
                          style={{ backgroundColor: accent, color: "white" }}
                        >
                          Current
                        </span>
                      )}
                      {v.version_number === 1 && !isCurrent && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          Original
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(v.created_at).toLocaleString("nl-NL")}
                    </p>
                  </div>
                  {!isCurrent && (
                    <Link
                      href={`/quotes/${quote.id}?v=${v.version_number}`}
                      className="text-sm underline text-muted-foreground hover:text-foreground"
                    >
                      View
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
