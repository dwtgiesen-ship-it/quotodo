import Link from "next/link";
import { listInvoices } from "@/lib/actions/invoices";
import { formatCents } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
};

export default async function InvoicesPage() {
  const result = await listInvoices();
  const invoices = result.success ? result.data ?? [] : [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="border rounded-lg p-12 text-center space-y-2">
          <p className="text-muted-foreground">No invoices yet.</p>
          <p className="text-sm text-muted-foreground">
            Accept a quote and click &quot;Convert to Invoice&quot; to create your first invoice.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Invoice</th>
                <th className="text-left p-3 font-medium">Client</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-left p-3 font-medium">Issued</th>
                <th className="text-left p-3 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-0">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="block p-3 font-mono text-xs"
                    >
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={`/invoices/${inv.id}`} className="block p-3">
                      {inv.client_name || "—"}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={`/invoices/${inv.id}`} className="block p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          statusStyles[inv.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </Link>
                  </td>
                  <td className="p-0 text-right">
                    <Link href={`/invoices/${inv.id}`} className="block p-3">
                      {formatCents(inv.total, inv.currency)}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="block p-3 text-muted-foreground"
                    >
                      {inv.issued_at
                        ? new Date(inv.issued_at).toLocaleDateString("nl-NL")
                        : "—"}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="block p-3 text-muted-foreground"
                    >
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString("nl-NL")
                        : "—"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
