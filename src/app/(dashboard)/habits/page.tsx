import * as React from "react";
import { requireUser } from "@/server/auth/session";
import { habitService } from "@/server/services/habit.service";
import { sectionService } from "@/server/services/section.service";
import { HabitList } from "@/components/features/habits/HabitList";
import { Flame } from "lucide-react";

export const metadata = {
  title: "Habits — Progress Tracker",
  description: "Build lasting routines, track daily streaks, and maintain consistency.",
};

export default async function HabitsPage() {
  const user = await requireUser();
  const [habits, sections] = await Promise.all([
    habitService.getHabits(user.id),
    sectionService.getSections(user.id),
  ]);

  return (
    <div className="space-y-6 animate-enter-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Consistency & Routines</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Habits & Streaks
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
            Build lasting habits with deterministic streak tracking, grace periods, and weekly schedules.
          </p>
        </div>
      </div>

      {/* Main Habit List */}
      <HabitList initialHabits={habits} sections={sections} />
    </div>
  );
}
