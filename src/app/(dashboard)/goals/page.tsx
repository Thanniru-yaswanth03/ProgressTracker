import * as React from "react";
import { requireUser } from "@/server/auth/session";
import { goalService } from "@/server/services/goal.service";
import { sectionService } from "@/server/services/section.service";
import { GoalsView } from "@/components/features/goals/GoalsView";
import { Target } from "lucide-react";

export const metadata = {
  title: "Goals & Milestones — Progress Tracker",
  description: "Set measurable targets, track progress milestones, and celebrate achievements.",
};

export default async function GoalsPage() {
  const user = await requireUser();
  const [goals, sections] = await Promise.all([
    goalService.getGoals(user.id),
    sectionService.getSections(user.id),
  ]);

  return (
    <div className="space-y-6 animate-enter-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>Vision & Milestones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Goals & Targets
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
            Track quantifiable long-term objectives with custom units, progress steppers, and deadline timers.
          </p>
        </div>
      </div>

      {/* Main Goals View */}
      <GoalsView initialGoals={goals} sections={sections} />
    </div>
  );
}
