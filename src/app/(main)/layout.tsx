import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="border-b bg-background">
        <div className="max-w-5xl mx-auto px-8 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-lg">
            Quotodo
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/invoices" className="hover:underline">
              Invoices
            </Link>
            <Link href="/settings" className="hover:underline">
              Settings
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
