import * as React from "react";
import { requireUser } from "@/server/auth/session";
import { habitService } from "@/server/services/habit.service";
import { sectionService } from "@/server/services/section.service";
import { HabitList } from "@/components/features/habits/HabitList";
import { Flame } from "lucide-react";

export const metadata = {
  title: "Habits & Streaks — Progress Tracker",
  description: "Build daily and weekly routines, track streaks, and achieve lifelong momentum.",
};

export default async function HabitsPage() {
  const user = await requireUser();
  const [habits, sections] = await Promise.all([
    habitService.getHabits(user.id, { archived: false }),
    sectionService.getSections(user.id),
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4" />
            <span>Habit Tracking & Consistency</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Habit Streaks & Routines
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track daily routines and weekly target days with a rolling 7-day completion matrix and streak calculation.
          </p>
        </div>
      </div>

      {/* Habits List View */}
      <HabitList initialHabits={habits} sections={sections} />
    </div>
  );
}
