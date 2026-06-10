import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import "./globals.css";

// UI / body — distinctive, premium humanist sans (not the generic Inter/Geist/Roboto).
const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Display — characterful modern grotesque for marketing headlines.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Schedulemode — the easiest salon software in the world",
  description: "Booking, calendar, payments, clients and marketing in one place. Live in 10 minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        {/* Apply the saved/system theme before paint to avoid a flash of the wrong mode. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var m=t||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(m==='dark')document.documentElement.classList.add('dark');document.documentElement.style.colorScheme=m;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-sf-bg text-sf-ink">{children}</body>
    </html>
  );
}
