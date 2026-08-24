"use client";

import * as React from "react";
import { HabitDTO, HabitDayStatus } from "@/types";
import { Card } from "@/components/ui/Card";
import { toggleHabitLogAction, archiveHabitAction } from "@/server/actions/habit.actions";
import {
  Archive,
  ArchiveRestore,
  Award,
  Check,
  Edit2,
  Flame,
  Folder,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface HabitCardProps {
  habit: HabitDTO;
  onEdit: (habit: HabitDTO) => void;
  onDelete: (habit: HabitDTO) => void;
  onMutationSuccess?: () => void;
}

export function HabitCard({
  habit,
  onEdit,
  onDelete,
  onMutationSuccess,
}: HabitCardProps) {
  const [week, setWeek] = React.useState<HabitDayStatus[]>(habit.weekHistory);
  const [streak, setStreak] = React.useState(habit.streak);
  const [togglingDate, setTogglingDate] = React.useState<string | null>(null);
  const [isArchiving, setIsArchiving] = React.useState(false);

  React.useEffect(() => {
    setWeek(habit.weekHistory);
    setStreak(habit.streak);
  }, [habit]);

  const handleToggleDay = async (day: HabitDayStatus) => {
    if (togglingDate) return;
    setTogglingDate(day.date);

    // Optimistic UI update
    const nextCompleted = !day.completed;
    setWeek((prev) =>
      prev.map((d) => (d.date === day.date ? { ...d, completed: nextCompleted } : d))
    );

    try {
      const res = await toggleHabitLogAction(habit.id, day.date);
      if (!res.success) {
        // Rollback
        setWeek((prev) =>
          prev.map((d) => (d.date === day.date ? { ...d, completed: day.completed } : d))
        );
      } else if (res.data?.habit) {
        setStreak(res.data.habit.streak);
        setWeek(res.data.habit.weekHistory);
        if (onMutationSuccess) onMutationSuccess();
      }
    } catch {
      // Rollback
      setWeek((prev) =>
        prev.map((d) => (d.date === day.date ? { ...d, completed: day.completed } : d))
      );
    } finally {
      setTogglingDate(null);
    }
  };

  const handleToggleArchive = async () => {
    setIsArchiving(true);
    try {
      const res = await archiveHabitAction(habit.id, !habit.archived);
      if (res.success && onMutationSuccess) {
        onMutationSuccess();
      }
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Card
      className={cn(
        "group flex flex-col justify-between p-4 sm:p-5 border-slate-800/80 hover:border-slate-700/80 transition-all",
        habit.archived && "opacity-60 bg-slate-950/40"
      )}
    >
      <div className="space-y-3.5">
        {/* Top Header: Title, Badges & Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* Section Tag */}
              {habit.section && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                  style={{
                    color: habit.section.color || "#6366f1",
                    backgroundColor: `${habit.section.color || "#6366f1"}15`,
                    borderColor: `${habit.section.color || "#6366f1"}30`,
                  }}
                >
                  <Folder className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[110px]">{habit.section.name}</span>
                </span>
              )}

              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {habit.frequency === "daily" ? "Daily" : "Weekly Routine"}
              </span>

              {habit.archived && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Archived
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {habit.title}
            </h4>

            {habit.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {habit.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={handleToggleArchive}
              disabled={isArchiving}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={habit.archived ? "Unarchive habit" : "Archive habit"}
              aria-label={habit.archived ? `Unarchive ${habit.title}` : `Archive ${habit.title}`}
            >
              {habit.archived ? (
                <ArchiveRestore className="w-3.5 h-3.5" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onEdit(habit)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Edit habit"
              aria-label={`Edit ${habit.title}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(habit)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Delete habit"
              aria-label={`Delete ${habit.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Current & Longest Streak Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Active Streak */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-xs transition-all",
              streak.currentStreak > 0
                ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
            )}
          >
            <Flame
              className={cn(
                "w-4 h-4",
                streak.currentStreak > 0 && "text-amber-500 dark:text-amber-400 fill-amber-400/30 animate-pulse"
              )}
            />
            <span>
              {streak.currentStreak} day{streak.currentStreak === 1 ? "" : "s"} streak
            </span>
          </div>

          {/* Longest Streak Record */}
          {streak.longestStreak > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Record: {streak.longestStreak}d</span>
            </div>
          )}

          {/* 30-Day Completion Rate */}
          {streak.completionRate !== undefined && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              <span>{streak.completionRate}% consistency</span>
            </div>
          )}
        </div>

        {/* 7-Day Rolling Weekly Check-in Circles */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {week.map((day) => {
              const isTogglingThis = togglingDate === day.date;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => handleToggleDay(day)}
                  disabled={isTogglingThis || habit.archived}
                  className={cn(
                    "flex-1 flex flex-col items-center py-2 px-1 rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500",
                    day.isToday && "ring-1 ring-indigo-500/50 bg-indigo-500/5",
                    day.completed
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                      : day.isTargetDay
                      ? "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400"
                      : "bg-slate-100/50 dark:bg-slate-950/40 border-dashed border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
                  )}
                  title={`${day.date} (${day.completed ? "Completed" : "Incomplete"})`}
                >
                  <span className="text-[10px] font-semibold uppercase opacity-80">
                    {day.isToday ? "Today" : day.dayLabel}
                  </span>

                  <div
                    className={cn(
                      "w-6 h-6 rounded-full mt-1.5 flex items-center justify-center transition-all",
                      day.completed
                        ? "bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 font-bold shadow-md shadow-amber-500/30 scale-105"
                        : day.isTargetDay
                        ? "border border-slate-700 bg-slate-800/40 text-slate-400"
                        : "border border-dashed border-slate-800 text-slate-600"
                    )}
                  >
                    {day.completed ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <span className="text-[10px] font-medium">{day.dayNumber}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
