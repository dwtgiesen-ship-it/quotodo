"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCompany } from "@/lib/actions/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Company } from "@/types";

export function SettingsForm({ company }: { company: Company }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState(company.company_name);
  const [address, setAddress] = useState(company.address);
  const [postalCode, setPostalCode] = useState(company.postal_code ?? "");
  const [city, setCity] = useState(company.city ?? "");
  const [vatNumber, setVatNumber] = useState(company.vat_number);
  const [iban, setIban] = useState(company.iban);
  const [logoUrl, setLogoUrl] = useState(company.logo_url ?? "");
  const [brandColor, setBrandColor] = useState(company.brand_color_primary ?? "#111111");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await updateCompany({
      company_name: companyName,
      address,
      postal_code: postalCode,
      city,
      vat_number: vatNumber,
      iban,
      logo_url: logoUrl,
      brand_color_primary: brandColor,
    });

    setSaving(false);

    if (!res.success) {
      setError(res.error || "Save failed");
      return;
    }

    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Company info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Company</h2>

          <div className="space-y-2">
            <Label htmlFor="company_name">Company name</Label>
            <Input
              id="company_name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal code</Label>
              <Input
                id="postal_code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vat_number">BTW-nummer</Label>
            <Input
              id="vat_number"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} required />
          </div>
        </section>

        {/* Branding */}
        <section className="space-y-4 border-t pt-6">
          <h2 className="text-lg font-semibold">Branding</h2>
          <p className="text-sm text-muted-foreground">
            Customize how your quotes look. Leave empty for plain black & white.
          </p>

          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Paste a public URL to your company logo (PNG or JPG).
            </p>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo preview"
                className="mt-2 h-16 object-contain border rounded p-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand_color">Primary brand color</Label>
            <div className="flex gap-3 items-center">
              <Input
                id="brand_color"
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#111111"
                className="font-mono flex-1"
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-green-600">Saved</p>}
        </div>
      </form>
    </div>
  );
}
