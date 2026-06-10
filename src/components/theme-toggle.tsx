"use client";

// Light/dark theme toggle. The initial class is set pre-paint by the inline
// script in layout.tsx; this just flips + persists the choice.
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next);
    root.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      title={mounted && dark ? "Switch to light" : "Switch to dark"}
      className={`grid size-9 place-items-center rounded-lg border transition-colors ${
        onDark
          ? "border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
          : "border-sf-line text-sf-ink2 hover:bg-sf-soft hover:text-sf-ink"
      }`}
    >
      {/* render a stable icon until mounted to avoid hydration mismatch */}
      {mounted && dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
