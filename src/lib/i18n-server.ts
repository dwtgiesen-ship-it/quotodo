import { cookies } from "next/headers";
import { dict, type Dict, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  return jar.get("lang")?.value === "nl" ? "nl" : "en";
}

export async function getDict(): Promise<Dict> {
  return dict[await getLocale()];
}
