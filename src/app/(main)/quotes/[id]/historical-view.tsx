"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/utils";
import type { QuoteVersion } from "@/types";

export function HistoricalVersionView({
  quoteId,
  quoteNumber,
  version,
  currentVersion,
  changes,
  brandColor,
  allVersions,
}: {
  quoteId: string;
  quoteNumber: string;
  version: QuoteVersion;
  currentVersion: number;
  changes: string[];
  brandColor: string | null;
  allVersions: QuoteVersion[];
}) {
  const router = useRouter();
  const accent = brandColor || "#111111";
  const data = version.data;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Read-only banner */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Viewing version {version.version_number} (read-only)
          </p>
          <p className="text-xs text-amber-800 mt-1">
            Current version is {currentVersion}. Changes below show what was modified since the previous version.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/quotes/${quoteId}`)}
        >
          Back to current
        </Button>
      </div>

      {/* Version switcher */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-muted-foreground">Jump to:</span>
        {allVersions.map((v) => (
          <Link
            key={v.id}
            href={
              v.version_number === currentVersion
                ? `/quotes/${quoteId}`
                : `/quotes/${quoteId}?v=${v.version_number}`
            }
            className={`px-2 py-0.5 rounded ${
              v.version_number === version.version_number
                ? "bg-foreground text-background"
                : "border hover:bg-muted"
            }`}
          >
            v{v.version_number}
            {v.version_number === currentVersion && " (current)"}
          </Link>
        ))}
      </div>

      {/* Changes since previous */}
      {changes.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <p className="text-sm font-semibold mb-2">
            Changes since previous version
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
            {changes.map((change, i) => (
              <li key={i}>{change}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Quote {quoteNumber} · version {version.version_number} · captured{" "}
          {new Date(version.created_at).toLocaleString("nl-NL")}
        </p>
        <h1 className="text-3xl font-bold" style={{ color: accent }}>
          {data.title}
        </h1>
        {data.client_name && (
          <p className="text-muted-foreground mt-2">for {data.client_name}</p>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          <p className="text-sm">{data.summary}</p>
        </section>
      )}

      {/* Included */}
      {data.scope_included.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Included</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {data.scope_included.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Timeline */}
      {data.timeline && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Timeline</h2>
          <p className="text-sm">{data.timeline}</p>
        </section>
      )}

      {/* Pricing */}
      {data.line_items.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Pricing</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2 font-medium">Description</th>
                <th className="text-right pb-2 font-medium w-16">Qty</th>
                <th className="text-right pb-2 font-medium w-24">Unit</th>
                <th className="text-right pb-2 font-medium w-28">Price</th>
                <th className="text-right pb-2 font-medium w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.line_items.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right text-muted-foreground">{item.unit}</td>
                  <td className="py-2 text-right">
                    {formatCents(item.unit_price, data.currency)}
                  </td>
                  <td className="py-2 text-right">
                    {formatCents(item.line_total, data.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCents(data.subtotal, data.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT</span>
                <span>{formatCents(data.vat_amount, data.currency)}</span>
              </div>
              <div
                className="flex justify-between pt-2 border-t-2 font-bold text-base"
                style={{ borderColor: accent, color: accent }}
              >
                <span>Total</span>
                <span>{formatCents(data.total, data.currency)}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {data.notes && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Notes
          </p>
          <p className="text-sm">{data.notes}</p>
        </section>
      )}
    </div>
  );
}
