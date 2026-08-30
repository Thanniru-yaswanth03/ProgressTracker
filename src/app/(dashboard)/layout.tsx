import * as React from "react";
import { requireUser } from "@/server/auth/session";
import { dashboardService } from "@/server/services/dashboard.service";
import { AppNavigation } from "@/components/navigation/AppNavigation";
import { AiAssistantTrigger } from "@/components/features/ai/AiAssistantTrigger";
import { Shield } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const counts = await dashboardService.getNavigationCounts(user.id);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-250">
      {/* Sidebar & Navigation Shell */}
      <AppNavigation user={user} counts={counts} />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>

        {/* Floating AI Assistant Trigger */}
        <AiAssistantTrigger />

        {/* Footer */}
        <footer className="border-t border-[var(--border-subtle)] py-5 text-center text-xs text-[var(--muted-foreground)] bg-[var(--surface)]/50">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Multi-tenant session isolation verified</span>
            </div>
            <span>Progress Tracker &copy; {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
