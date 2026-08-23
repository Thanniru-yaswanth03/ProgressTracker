"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HabitDTO, SectionDTO } from "@/types";
import { Card } from "@/components/ui/Card";
import { toggleHabitLogAction } from "@/server/actions/habit.actions";
import { Award, Check, ChevronRight, Flame, Plus } from "lucide-react";
import { HabitModal } from "@/components/features/habits/HabitModal";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TodayHabitsWidgetProps {
  habits: HabitDTO[];
  sections: SectionDTO[];
}

export function TodayHabitsWidget({ habits: initialHabits, sections }: TodayHabitsWidgetProps) {
  const router = useRouter();
  const [habits, setHabits] = React.useState<HabitDTO[]>(initialHabits);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  React.useEffect(() => {
    setHabits(initialHabits);
  }, [initialHabits]);

  const handleToggleToday = async (habit: HabitDTO) => {
    if (togglingId) return;
    setTogglingId(habit.id);

    const nextCompleted = !habit.streak.isCompletedToday;
    const nextCurrentStreak = nextCompleted
      ? habit.streak.currentStreak + 1
      : Math.max(0, habit.streak.currentStreak - 1);

    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              streak: {
                ...h.streak,
                isCompletedToday: nextCompleted,
                currentStreak: nextCurrentStreak,
              },
            }
          : h
      )
    );

    try {
      const res = await toggleHabitLogAction(habit.id);
      if (!res.success) {
        // Rollback
        setHabits((prev) =>
          prev.map((h) => (h.id === habit.id ? { ...h, streak: habit.streak } : h))
        );
      } else {
        router.refresh();
      }
    } catch {
      // Rollback
      setHabits((prev) =>
        prev.map((h) => (h.id === habit.id ? { ...h, streak: habit.streak } : h))
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Card className="p-5 border-slate-800/80 flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Habit Streaks
            </h3>
            <span className="text-[11px] text-slate-400">
              {habits.filter((h) => h.streak.isCompletedToday).length} of {habits.length} checked today
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Add habit"
          >
            <Plus className="w-4 h-4" />
          </button>
          <Link
            href="/habits"
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Habit List */}
      <div className="space-y-2 flex-1 min-h-[160px]">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-500">
            <Flame className="w-8 h-8 opacity-30 mb-2" />
            <p className="text-xs">No active habits yet. Build your first routine! ⚡</p>
          </div>
        ) : (
          habits.slice(0, 5).map((habit) => {
            const isDoneToday = habit.streak.isCompletedToday;
            const isToggling = togglingId === habit.id;

            return (
              <div
                key={habit.id}
                className={cn(
                  "flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all",
                  isDoneToday
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-slate-900/70 border-slate-800/80 hover:border-slate-700"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleToday(habit)}
                    disabled={isToggling}
                    className={cn(
                      "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer",
                      isDoneToday
                        ? "bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                        : "border-slate-700 hover:border-amber-400 bg-slate-800/60"
                    )}
                    title={isDoneToday ? "Uncheck today" : "Check in today"}
                  >
                    {isDoneToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate text-slate-100">
                      {habit.title}
                    </div>

                    {habit.section && (
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: habit.section.color || "#f59e0b" }}
                      >
                        {habit.section.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Streak Badge */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border",
                      habit.streak.currentStreak > 0
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        : "bg-slate-900 border-slate-800 text-slate-500"
                    )}
                  >
                    <Flame className="w-3 h-3" />
                    <span>{habit.streak.currentStreak}d</span>
                  </div>

                  {habit.streak.longestStreak > 0 && (
                    <span
                      className="text-[10px] text-slate-500 hidden sm:inline"
                      title={`Best record: ${habit.streak.longestStreak} days`}
                    >
                      🏆 {habit.streak.longestStreak}d
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <HabitModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        sections={sections}
        onSuccess={() => router.refresh()}
      />
    </Card>
  );
}
