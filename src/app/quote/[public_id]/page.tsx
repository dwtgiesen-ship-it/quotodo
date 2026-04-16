import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import type { Quote, QuoteLineItem, Company } from "@/types";
import { InteractivePricing } from "./interactive-pricing";

export const dynamic = "force-dynamic";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ public_id: string }>;
}) {
  const { public_id } = await params;
  const supabase = createAdminClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("public_id", public_id)
    .single();

  if (!quote) {
    notFound();
  }

  const [{ data: company }, { data: lineItems }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", quote.company_id).single(),
    supabase
      .from("quote_line_items")
      .select("*")
      .eq("quote_id", quote.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (!company) {
    notFound();
  }

  const q = quote as Quote;
  const c = company as Company;
  const items = (lineItems ?? []) as QuoteLineItem[];
  const accent = c.brand_color_primary || "#111111";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border p-12 space-y-10">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b">
          <div>
            {c.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.logo_url}
                alt={c.company_name}
                className="h-12 mb-3 object-contain"
              />
            ) : (
              <h2 className="text-lg font-bold mb-2">{c.company_name}</h2>
            )}
            <p className="text-sm text-muted-foreground">{c.address}</p>
            {(c.postal_code || c.city) && (
              <p className="text-sm text-muted-foreground">
                {[c.postal_code, c.city].filter(Boolean).join(" ")}
              </p>
            )}
            <p className="text-sm text-muted-foreground">BTW: {c.vat_number}</p>
          </div>
          <div className="text-right">
            <p
              className="text-2xl font-bold tracking-widest mb-3"
              style={{ color: accent }}
            >
              QUOTE
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">No. </span>
              <span className="font-medium">{q.quote_number}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Date </span>
              <span className="font-medium">{formatDate(q.created_at)}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Version </span>
              <span className="font-medium">v{q.current_version}</span>
              {q.current_version > 1 && (
                <span
                  className="ml-2 text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: accent, color: "white" }}
                >
                  Updated
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Client */}
        {(q.client_name || q.client_email) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Quote for
            </p>
            {q.client_name && <p className="font-semibold">{q.client_name}</p>}
            {q.client_email && (
              <p className="text-sm text-muted-foreground">{q.client_email}</p>
            )}
          </div>
        )}

        {/* Title + Summary */}
        <div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: accent }}>
            {q.title}
          </h1>
          {q.summary && <p className="text-sm leading-relaxed">{q.summary}</p>}
        </div>

        {/* Included */}
        {q.scope_included.length > 0 && (
          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ color: accent }}
            >
              Included
            </h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {q.scope_included.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Excluded */}
        {q.scope_excluded.length > 0 && (
          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ color: accent }}
            >
              Not included
            </h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {q.scope_excluded.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Timeline */}
        {q.timeline && (
          <section>
            <h2
              className="text-base font-semibold mb-2"
              style={{ color: accent }}
            >
              Timeline
            </h2>
            <p className="text-sm">{q.timeline}</p>
          </section>
        )}

        {/* Pricing + Accept (interactive) */}
        {items.length > 0 && (
          <InteractivePricing
            publicId={q.public_id}
            currency={q.currency}
            items={items}
            status={q.status}
            acceptedAt={q.accepted_at}
            rejectedAt={q.rejected_at}
            acceptedSelection={q.accepted_selection}
            acceptedTotal={q.accepted_total}
            accent={accent}
          />
        )}

        {/* Footer */}
        <div className="pt-6 border-t space-y-4 text-xs">
          <div>
            <p className="font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Payment terms
            </p>
            <p>
              Payable within {q.payment_terms} days of invoice date to IBAN {c.iban}.
            </p>
          </div>
          {q.notes && (
            <div>
              <p className="font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Notes
              </p>
              <p>{q.notes}</p>
            </div>
          )}
        </div>

      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Quote generated with Quotodo
      </p>
    </div>
  );
}
