import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Company, Quote, QuoteLineItem } from "@/types";

// -------- Styles --------

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111111",
    lineHeight: 1.5,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  companyMeta: {
    fontSize: 9,
    color: "#555555",
    marginBottom: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  quoteLabel: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    marginBottom: 10,
  },
  metaLine: {
    flexDirection: "row",
    fontSize: 9,
    marginBottom: 2,
  },
  metaKey: {
    color: "#555555",
    width: 80,
    textAlign: "right",
    marginRight: 8,
  },
  metaValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },

  // Rule
  rule: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
    marginVertical: 24,
  },
  ruleTight: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
    marginVertical: 16,
  },

  // Section label (uppercase small-caps)
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#777777",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },

  // Client
  clientName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  clientEmail: {
    fontSize: 10,
    color: "#555555",
  },

  // Title + Summary
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  summary: {
    fontSize: 10,
    color: "#333333",
    marginBottom: 8,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bulletDot: {
    width: 12,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
  },

  // Pricing table
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    paddingBottom: 6,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#777777",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eeeeee",
  },
  cellDescription: { flex: 3, paddingRight: 12 },
  cellQty: { width: 40, textAlign: "right" },
  cellUnit: { width: 60, textAlign: "right" },
  cellPrice: { width: 70, textAlign: "right" },
  cellLineTotal: { width: 70, textAlign: "right" },

  // Totals
  totalsWrap: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsTable: {
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    fontSize: 10,
  },
  totalKey: {
    color: "#555555",
  },
  totalValue: {
    fontFamily: "Helvetica",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#111111",
  },
  grandTotalKey: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },

  // Footer
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: "#cccccc",
  },
  footerBlock: {
    marginBottom: 12,
  },
  footerKey: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#777777",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  footerText: {
    fontSize: 9,
    color: "#333333",
  },
});

// -------- Helpers --------

function formatCurrency(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

function computeValidUntil(quote: Quote, company: Company): string {
  if (quote.valid_until) return formatDate(quote.valid_until);
  const base = new Date(quote.created_at);
  base.setDate(base.getDate() + (company.default_quote_validity ?? 30));
  return formatDate(base.toISOString());
}

// -------- Document --------

interface QuoteDocumentProps {
  quote: Quote;
  lineItems: QuoteLineItem[];
  company: Company;
}

function QuoteDocument({ quote, lineItems, company }: QuoteDocumentProps) {
  const hasClient = Boolean(quote.client_name || quote.client_email);
  const accent = company.brand_color_primary || "#111111";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {company.logo_url ? (
              <Image
                src={company.logo_url}
                style={{ maxHeight: 48, maxWidth: 160, marginBottom: 10, objectFit: "contain" }}
              />
            ) : (
              <Text style={styles.companyName}>{company.company_name}</Text>
            )}
            <Text style={styles.companyMeta}>{company.address}</Text>
            {(company.postal_code || company.city) && (
              <Text style={styles.companyMeta}>
                {[company.postal_code, company.city].filter(Boolean).join(" ")}
              </Text>
            )}
            <Text style={styles.companyMeta}>BTW: {company.vat_number}</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={[styles.quoteLabel, { color: accent }]}>QUOTE</Text>
            <View style={styles.metaLine}>
              <Text style={styles.metaKey}>No.</Text>
              <Text style={styles.metaValue}>{quote.quote_number}</Text>
            </View>
            <View style={styles.metaLine}>
              <Text style={styles.metaKey}>Date</Text>
              <Text style={styles.metaValue}>{formatDate(quote.created_at)}</Text>
            </View>
            <View style={styles.metaLine}>
              <Text style={styles.metaKey}>Valid until</Text>
              <Text style={styles.metaValue}>{computeValidUntil(quote, company)}</Text>
            </View>
          </View>
        </View>

        {/* Client block */}
        {hasClient && (
          <>
            <View>
              <Text style={styles.sectionLabel}>Client</Text>
              {quote.client_name ? <Text style={styles.clientName}>{quote.client_name}</Text> : null}
              {quote.client_email ? <Text style={styles.clientEmail}>{quote.client_email}</Text> : null}
            </View>
            <View style={styles.rule} />
          </>
        )}

        {/* Title */}
        <Text style={[styles.title, { color: accent }]}>{quote.title}</Text>
        {quote.summary ? <Text style={styles.summary}>{quote.summary}</Text> : null}

        {/* Included */}
        {quote.scope_included.length > 0 && (
          <>
            <View style={styles.ruleTight} />
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: accent }]}>Included</Text>
              {quote.scope_included.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Excluded */}
        {quote.scope_excluded.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: accent }]}>Not included</Text>
            {quote.scope_excluded.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Timeline */}
        {quote.timeline ? (
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: accent }]}>Timeline</Text>
            <Text>{quote.timeline}</Text>
          </View>
        ) : null}

        {/* Pricing */}
        {lineItems.length > 0 && (
          <>
            <View style={styles.ruleTight} />
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: accent }]}>Pricing</Text>

              <View style={styles.table}>
                <View style={[styles.tableHeader, { borderBottomColor: accent }]}>
                  <Text style={[styles.tableHeaderCell, styles.cellDescription]}>Description</Text>
                  <Text style={[styles.tableHeaderCell, styles.cellQty]}>Qty</Text>
                  <Text style={[styles.tableHeaderCell, styles.cellUnit]}>Unit</Text>
                  <Text style={[styles.tableHeaderCell, styles.cellPrice]}>Price</Text>
                  <Text style={[styles.tableHeaderCell, styles.cellLineTotal]}>Total</Text>
                </View>

                {lineItems.map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={styles.cellDescription}>{item.description}</Text>
                    <Text style={styles.cellQty}>{item.quantity}</Text>
                    <Text style={styles.cellUnit}>{item.unit}</Text>
                    <Text style={styles.cellPrice}>
                      {formatCurrency(item.unit_price, quote.currency)}
                    </Text>
                    <Text style={styles.cellLineTotal}>
                      {formatCurrency(item.line_total, quote.currency)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Totals block */}
              <View style={styles.totalsWrap}>
                <View style={styles.totalsTable}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalKey}>Subtotal</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(quote.subtotal, quote.currency)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalKey}>VAT</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(quote.vat_amount, quote.currency)}
                    </Text>
                  </View>
                  <View style={[styles.grandTotalRow, { borderTopColor: accent }]}>
                    <Text style={[styles.grandTotalKey, { color: accent }]}>Total</Text>
                    <Text style={[styles.grandTotalValue, { color: accent }]}>
                      {formatCurrency(quote.total, quote.currency)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBlock}>
            <Text style={styles.footerKey}>Payment terms</Text>
            <Text style={styles.footerText}>
              Payable within {quote.payment_terms} days of invoice date to IBAN {company.iban}.
            </Text>
          </View>

          {quote.notes ? (
            <View style={styles.footerBlock}>
              <Text style={styles.footerKey}>Notes</Text>
              <Text style={styles.footerText}>{quote.notes}</Text>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

// -------- Export --------

export async function renderQuotePDF(
  quote: Quote,
  lineItems: QuoteLineItem[],
  company: Company
): Promise<Buffer> {
  return await renderToBuffer(
    <QuoteDocument quote={quote} lineItems={lineItems} company={company} />
  );
}
