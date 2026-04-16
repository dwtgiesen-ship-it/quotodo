import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listQuotes } from "@/lib/actions/quotes";
import { listInvoices } from "@/lib/actions/invoices";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/utils";

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

  // Stats
  const stats = {
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
    invoicesOutstanding: invoices.filter((i) => i.status === "sent").length,
    revenuePaid: invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.total, 0),
    revenueOutstanding: invoices
      .filter((i) => i.status === "sent")
      .reduce((sum, i) => sum + i.total, 0),
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue (paid)</p>
          <p className="text-3xl font-bold mt-2 text-green-700">
            {formatCents(stats.revenuePaid)}
          </p>
        </div>
        <div className="border rounded-lg p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Outstanding (sent)
          </p>
          <p className="text-3xl font-bold mt-2">{formatCents(stats.revenueOutstanding)}</p>
        </div>
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
