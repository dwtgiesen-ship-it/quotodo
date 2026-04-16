import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listQuotes } from "@/lib/actions/quotes";
import { listInvoices } from "@/lib/actions/invoices";
import { Button } from "@/components/ui/button";
import { formatCents, isOverdue, daysBetween } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: company } = await supabase
    .from("companies")
    .select("company_name")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    redirect("/onboarding");
  }

  const [quotesResult, invoicesResult] = await Promise.all([
    listQuotes(),
    listInvoices(),
  ]);
  const quotes = quotesResult.success ? quotesResult.data ?? [] : [];
  const invoices = invoicesResult.success ? invoicesResult.data ?? [] : [];

  // Compute "this month" for revenue
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Overdue invoices
  const overdueInvoices = invoices.filter((i) => isOverdue(i.status, i.due_date));

  // Paid invoices — compute average payment time (days from issued to paid)
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const paymentTimes = paidInvoices
    .filter((i) => i.issued_at && i.paid_at)
    .map((i) => daysBetween(i.issued_at!, i.paid_at!));
  const avgPaymentTime =
    paymentTimes.length > 0
      ? Math.round(paymentTimes.reduce((a, b) => a + b, 0) / paymentTimes.length)
      : null;

  const stats = {
    // Quote pipeline
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
    invoicesOutstanding: invoices.filter((i) => i.status === "sent").length,

    // Cash flow
    revenuePaid: paidInvoices.reduce((sum, i) => sum + i.total, 0),
    revenueThisMonth: paidInvoices
      .filter((i) => i.paid_at && i.paid_at >= monthStart)
      .reduce((sum, i) => sum + i.total, 0),
    revenueOutstanding: invoices
      .filter((i) => i.status === "sent")
      .reduce((sum, i) => sum + i.total, 0),
    revenueOverdue: overdueInvoices.reduce((sum, i) => sum + i.total, 0),

    // Overdue
    overdueCount: overdueInvoices.length,
    avgPaymentTime,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {company.company_name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here&apos;s how your business is doing.
          </p>
        </div>
        <Link href="/quotes/new">
          <Button>New Quote</Button>
        </Link>
      </div>

      {/* Quote pipeline */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Pipeline
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Drafts</p>
            <p className="text-2xl font-bold mt-1">{stats.draft}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Sent</p>
            <p className="text-2xl font-bold mt-1">{stats.sent}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Accepted</p>
            <p className="text-2xl font-bold mt-1 text-green-700">{stats.accepted}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Outstanding</p>
            <p className="text-2xl font-bold mt-1">{stats.invoicesOutstanding}</p>
          </div>
          <div
            className={`border rounded-lg p-4 ${
              stats.overdueCount > 0 ? "bg-red-50 border-red-200" : ""
            }`}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Overdue</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                stats.overdueCount > 0 ? "text-red-700" : ""
              }`}
            >
              {stats.overdueCount}
            </p>
          </div>
        </div>
      </div>

      {/* Cash flow */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Cash Flow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Paid this month
            </p>
            <p className="text-2xl font-bold mt-2 text-green-700">
              {formatCents(stats.revenueThisMonth)}
            </p>
          </div>
          <div className="border rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Paid (all time)
            </p>
            <p className="text-2xl font-bold mt-2">{formatCents(stats.revenuePaid)}</p>
          </div>
          <div className="border rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Outstanding</p>
            <p className="text-2xl font-bold mt-2">{formatCents(stats.revenueOutstanding)}</p>
          </div>
          <div
            className={`border rounded-lg p-5 ${
              stats.revenueOverdue > 0 ? "bg-red-50 border-red-200" : ""
            }`}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Overdue</p>
            <p
              className={`text-2xl font-bold mt-2 ${
                stats.revenueOverdue > 0 ? "text-red-700" : ""
              }`}
            >
              {formatCents(stats.revenueOverdue)}
            </p>
          </div>
        </div>
        {stats.avgPaymentTime !== null && (
          <p className="text-xs text-muted-foreground mt-3">
            Average payment time: {stats.avgPaymentTime} day
            {stats.avgPaymentTime === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {/* Recent quotes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent quotes</h2>
          <p className="text-sm text-muted-foreground">
            {quotes.length} {quotes.length === 1 ? "quote" : "quotes"}
          </p>
        </div>

        {quotes.length === 0 ? (
          <div className="border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">No quotes yet.</p>
            <Link href="/quotes/new">
              <Button>Create your first quote</Button>
            </Link>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Quote</th>
                  <th className="text-left p-3 font-medium">Title</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {quotes.slice(0, 10).map((q) => (
                  <tr key={q.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-0">
                      <Link href={`/quotes/${q.id}`} className="block p-3 font-mono text-xs">
                        {q.quote_number}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={`/quotes/${q.id}`} className="block p-3">
                        {q.title}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={`/quotes/${q.id}`} className="block p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            q.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : q.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : q.status === "sent"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {q.status}
                        </span>
                      </Link>
                    </td>
                    <td className="p-0 text-right">
                      <Link href={`/quotes/${q.id}`} className="block p-3">
                        {formatCents(q.total)}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={`/quotes/${q.id}`} className="block p-3 text-muted-foreground">
                        {new Date(q.created_at).toLocaleDateString("nl-NL")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
