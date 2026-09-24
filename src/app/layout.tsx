import type { Metadata, Viewport } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const display = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Kofferklaar",
  description: "Jouw kast, jouw stylist: outfits en paklijst voor elke reis.",
  appleWebApp: { capable: true, title: "Kofferklaar", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e9" },
    { media: "(prefers-color-scheme: dark)", color: "#15130f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}
