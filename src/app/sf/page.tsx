import { redirect } from "next/navigation";

// The SalonFlow marketing site now lives at the root. Keep /sf as an alias.
export default function SfRedirect() {
  redirect("/");
}
