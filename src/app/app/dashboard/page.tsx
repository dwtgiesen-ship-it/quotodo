import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listQuotes } from "@/lib/actions/quotes";
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

  const quotesResult = await listQuotes();
  const quotes = quotesResult.success ? quotesResult.data ?? [] : [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {company.company_name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {quotes.length} {quotes.length === 1 ? "quote" : "quotes"}
          </p>
        </div>
        <Link href="/app/quotes/new">
          <Button>New Quote</Button>
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">No quotes yet.</p>
          <Link href="/app/quotes/new">
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
              {quotes.map((q) => (
                <tr
                  key={q.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="p-0">
                    <Link href={`/app/quotes/${q.id}`} className="block p-3 font-mono text-xs">
                      {q.quote_number}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={`/app/quotes/${q.id}`} className="block p-3">
                      {q.title}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={`/app/quotes/${q.id}`} className="block p-3">
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
                    <Link href={`/app/quotes/${q.id}`} className="block p-3">
                      {formatCents(q.total)}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={`/app/quotes/${q.id}`} className="block p-3 text-muted-foreground">
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
  );
}
