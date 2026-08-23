import * as React from "react";
import { requireUser } from "@/server/auth/session";
import { activityService } from "@/server/services/activity.service";
import { sectionService } from "@/server/services/section.service";
import { ActivityTimeline } from "@/components/features/activities/ActivityTimeline";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Activity Timeline — Progress Tracker",
  description: "Chronological audit trail of your completed accomplishments, work sessions, and milestones.",
};

export default async function ActivitiesPage() {
  const user = await requireUser();
  const [activities, sections] = await Promise.all([
    activityService.getActivities(user.id, { limit: 100 }),
    sectionService.getSections(user.id),
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Accomplishment Journal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Activity Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            A chronological record of what you actually completed, deep-work sessions, workouts, and milestones.
          </p>
        </div>
      </div>

      {/* Main Activities Timeline with Stats */}
      <ActivityTimeline
        initialActivities={activities}
        sections={sections}
      />
    </div>
  );
}
