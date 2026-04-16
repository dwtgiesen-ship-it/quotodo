import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Company, Invoice } from "@/types";

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  headerLeft: { flex: 1 },
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
  headerRight: { alignItems: "flex-end" },
  invoiceLabel: {
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
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#777777",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  clientEmail: {
    fontSize: 10,
    color: "#555555",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
  },
  section: { marginBottom: 24 },
  sectionHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
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
  cellQty: { width: 36, textAlign: "right" },
  cellUnit: { width: 50, textAlign: "right" },
  cellPrice: { width: 65, textAlign: "right" },
  cellVat: { width: 36, textAlign: "right" },
  cellLineTotal: { width: 70, textAlign: "right" },
  totalsWrap: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsTable: { width: 220 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    fontSize: 10,
  },
  totalKey: { color: "#555555" },
  totalValue: { fontFamily: "Helvetica" },
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
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: "#cccccc",
  },
  footerBlock: { marginBottom: 12 },
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

function formatCurrency(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

function InvoiceDocument({ invoice, company }: { invoice: Invoice; company: Company }) {
  const accent = company.brand_color_primary || "#111111";
  const hasClient = Boolean(invoice.client_name || invoice.client_email);

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
            <Text style={styles.companyMeta}>IBAN: {company.iban}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.invoiceLabel, { color: accent }]}>INVOICE</Text>
            <View style={styles.metaLine}>
              <Text style={styles.metaKey}>No.</Text>
              <Text style={styles.metaValue}>{invoice.invoice_number}</Text>
            </View>
            {invoice.issued_at && (
              <View style={styles.metaLine}>
                <Text style={styles.metaKey}>Issued</Text>
                <Text style={styles.metaValue}>{formatDate(invoice.issued_at)}</Text>
              </View>
            )}
            {invoice.due_date && (
              <View style={styles.metaLine}>
                <Text style={styles.metaKey}>Due</Text>
                <Text style={styles.metaValue}>{formatDate(invoice.due_date)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Client */}
        {hasClient && (
          <>
            <View>
              <Text style={styles.sectionLabel}>Billed to</Text>
              {invoice.client_name ? <Text style={styles.clientName}>{invoice.client_name}</Text> : null}
              {invoice.client_email ? <Text style={styles.clientEmail}>{invoice.client_email}</Text> : null}
            </View>
            <View style={styles.rule} />
          </>
        )}

        {/* Title */}
        {invoice.title ? (
          <Text style={[styles.title, { color: accent }]}>{invoice.title}</Text>
        ) : null}

        {/* Line items */}
        {invoice.line_items.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: accent }]}>Line items</Text>

            <View style={[styles.tableHeader, { borderBottomColor: accent }]}>
              <Text style={[styles.tableHeaderCell, styles.cellDescription]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.cellQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.cellUnit]}>Unit</Text>
              <Text style={[styles.tableHeaderCell, styles.cellPrice]}>Price</Text>
              <Text style={[styles.tableHeaderCell, styles.cellVat]}>VAT</Text>
              <Text style={[styles.tableHeaderCell, styles.cellLineTotal]}>Total</Text>
            </View>

            {invoice.line_items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.cellDescription}>{item.description}</Text>
                <Text style={styles.cellQty}>{item.quantity}</Text>
                <Text style={styles.cellUnit}>{item.unit}</Text>
                <Text style={styles.cellPrice}>
                  {formatCurrency(item.unit_price, invoice.currency)}
                </Text>
                <Text style={styles.cellVat}>{item.vat_rate}%</Text>
                <Text style={styles.cellLineTotal}>
                  {formatCurrency(item.line_total, invoice.currency)}
                </Text>
              </View>
            ))}

            {/* Totals */}
            <View style={styles.totalsWrap}>
              <View style={styles.totalsTable}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalKey}>Subtotal</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(invoice.subtotal, invoice.currency)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalKey}>VAT</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(invoice.vat_amount, invoice.currency)}
                  </Text>
                </View>
                <View style={[styles.grandTotalRow, { borderTopColor: accent }]}>
                  <Text style={[styles.grandTotalKey, { color: accent }]}>Total</Text>
                  <Text style={[styles.grandTotalValue, { color: accent }]}>
                    {formatCurrency(invoice.total, invoice.currency)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBlock}>
            <Text style={styles.footerKey}>Payment terms</Text>
            <Text style={styles.footerText}>
              Payable within {invoice.payment_terms} days
              {invoice.due_date ? ` (due ${formatDate(invoice.due_date)})` : ""}{" "}
              to IBAN {company.iban}.
            </Text>
            <Text style={styles.footerText}>
              Please reference invoice {invoice.invoice_number} with your payment.
            </Text>
          </View>
          {invoice.notes ? (
            <View style={styles.footerBlock}>
              <Text style={styles.footerKey}>Notes</Text>
              <Text style={styles.footerText}>{invoice.notes}</Text>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePDF(
  invoice: Invoice,
  company: Company
): Promise<Buffer> {
  return await renderToBuffer(<InvoiceDocument invoice={invoice} company={company} />);
}
