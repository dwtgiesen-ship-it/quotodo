import { redirect } from "next/navigation";
import { getCompany } from "@/lib/actions/companies";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const result = await getCompany();

  if (!result.success || !result.data) {
    redirect("/onboarding");
  }

  return <SettingsForm company={result.data} />;
}
