import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { SalonProvider } from "./lib/store";
import { TopNav } from "./components/top-nav";
import { RoleProvider } from "./components/role";

export const metadata: Metadata = {
  title: "Schedulemode",
  description: "The easiest salon management software in the world.",
};

export default function SchedulemodeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <SalonProvider>
        <div className="flex h-screen flex-col overflow-hidden bg-sf-bg2 text-sf-ink">
          <TopNav />
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </div>
        <Toaster position="bottom-right" />
      </SalonProvider>
    </RoleProvider>
  );
}
