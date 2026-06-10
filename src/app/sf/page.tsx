import { redirect } from "next/navigation";

// The Schedulemode marketing site now lives at the root. Keep /sf as an alias.
export default function SfRedirect() {
  redirect("/");
}
