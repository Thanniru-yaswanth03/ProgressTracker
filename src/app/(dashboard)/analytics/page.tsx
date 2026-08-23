import * as React from "react";
import { Metadata } from "next";
import { requireUser } from "@/server/auth/session";
import { analyticsService } from "@/server/services/analytics.service";
import { AnalyticsView } from "@/components/features/analytics/AnalyticsView";

export const metadata: Metadata = {
  title: "Analytics & Insights | Progress Tracker",
  description: "Comprehensive progress analytics, consistency rates, habit streaks, and task execution statistics.",
};

export default async function AnalyticsPage() {
  const user = await requireUser();
  const analytics = await analyticsService.getAnalytics(user.id);

  return <AnalyticsView analytics={analytics} />;
}
