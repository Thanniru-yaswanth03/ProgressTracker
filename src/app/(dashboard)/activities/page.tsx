import * as React from "react";
import { requireUser } from "@/server/auth/session";
import { activityService } from "@/server/services/activity.service";
import { sectionService } from "@/server/services/section.service";
import { ActivityTimeline } from "@/components/features/activities/ActivityTimeline";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Activities — Progress Tracker",
  description: "Track focus sessions, log deep work, and celebrate automated accomplishments.",
};

export default async function ActivitiesPage() {
  const user = await requireUser();
  const [activities, sections] = await Promise.all([
    activityService.getActivities(user.id),
    sectionService.getSections(user.id),
  ]);

  return (
    <div className="space-y-6 animate-enter-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Focus & Execution Log</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Accomplishments & Activities
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
            Track focused sessions, deep work blocks, and see automated completions from tasks and habits.
          </p>
        </div>
      </div>

      {/* Main Activity Timeline */}
      <ActivityTimeline initialActivities={activities} sections={sections} />
    </div>
  );
}
