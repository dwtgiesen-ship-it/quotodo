import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { WardrobeApp } from "@/components/wardrobe/wardrobe-app";

export const metadata: Metadata = { title: "Mijn kast · Kofferklaar" };

export default function KastPage() {
  return (
    <>
      <AppHeader />
      <WardrobeApp />
    </>
  );
}
