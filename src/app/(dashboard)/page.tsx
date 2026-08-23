import * as React from "react";
import { requireUser } from "@/server/auth/session";
import { dashboardService } from "@/server/services/dashboard.service";
import { sectionService } from "@/server/services/section.service";
import { DashboardView } from "@/components/features/dashboard/DashboardView";

export const metadata = {
  title: "Command Center — Progress Tracker",
  description: "Unified productivity command center tracking daily goals, habits, focus time, and milestones.",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const [dashboardData, sections] = await Promise.all([
    dashboardService.getDashboardData(user.id),
    sectionService.getSections(user.id),
  ]);

  return (
    <DashboardView
      userName={user.name || "Productivity Master"}
      data={dashboardData}
      sections={sections}
    />
  );
}
