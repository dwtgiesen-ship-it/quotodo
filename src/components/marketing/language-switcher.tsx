"use client";

import { useEffect, useState } from "react";
import { LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const [current, setCurrent] = useState<Locale>("en");
  useEffect(() => { setCurrent(document.cookie.includes("lang=nl") ? "nl" : "en"); }, []);

  function set(l: Locale) {
    document.cookie = `lang=${l};path=/;max-age=31536000`;
    window.location.reload();
  }

  return (
    <div className={`flex items-center rounded-lg p-0.5 text-[12px] font-semibold ${dark ? "bg-white/10" : "bg-[#f0f1f4]"}`}>
      {LOCALES.map((l) => (
        <button
          key={l.id}
          onClick={() => set(l.id)}
          className={`rounded-md px-2 py-1 transition-colors ${
            current === l.id
              ? dark ? "bg-white text-[#1f2a4d]" : "bg-white text-[#1f2a4d] shadow-sm"
              : dark ? "text-white/70 hover:text-white" : "text-[#6b7280] hover:text-[#1f2a4d]"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
