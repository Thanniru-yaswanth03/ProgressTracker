import * as React from "react";
import { requireUser } from "@/server/auth/session";
import { analyticsService } from "@/server/services/analytics.service";
import { AnalyticsView } from "@/components/features/analytics/AnalyticsView";
import { TrendingUp } from "lucide-react";

export const metadata = {
  title: "Analytics & Performance — Progress Tracker",
  description: "Explore real-time productivity analytics, velocity trends, completion rates, and streak records.",
};

export default async function AnalyticsPage() {
  const user = await requireUser();
  const analytics = await analyticsService.getAnalytics(user.id);

  return (
    <div className="space-y-6 animate-enter-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Velocity & Consistency Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
            Deterministic, cross-system performance analytics computed exclusively from your verified records.
          </p>
        </div>
      </div>

      {/* Main Analytics View */}
      <AnalyticsView analytics={analytics} />
    </div>
  );
}
