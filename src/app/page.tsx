import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Quotodo
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
            Generate professional quotes in seconds.
          </p>
        </div>

        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Paste any client email or message — get a branded quote ready to send.
        </p>

        <div className="pt-4">
          <Link href="/login">
            <Button size="lg" className="text-base px-8 h-12">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
