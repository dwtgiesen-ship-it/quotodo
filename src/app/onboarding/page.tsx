"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCompany } from "@/lib/actions/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      company_name: formData.get("company_name") as string,
      address: formData.get("address") as string,
      vat_number: formData.get("vat_number") as string,
      iban: formData.get("iban") as string,
    };

    const result = await createCompany(data);

    if (!result.success) {
      setError(result.error || "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/app/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Set up your company</CardTitle>
          <CardDescription>
            We need a few details to generate professional quotes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company name</Label>
              <Input id="company_name" name="company_name" required autoFocus />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vat_number">BTW-nummer</Label>
              <Input id="vat_number" name="vat_number" placeholder="NL000000000B01" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" name="iban" placeholder="NL00BANK0000000000" required />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting up..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
