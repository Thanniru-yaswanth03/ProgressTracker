"use client";

import * as React from "react";
import { WeeklyDayMetric } from "@/types";
import { Card } from "@/components/ui/Card";
import { BarChart3, CheckSquare, Flame, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WeeklyActivityChartProps {
  metrics: WeeklyDayMetric[];
}

export function WeeklyActivityChart({ metrics }: WeeklyActivityChartProps) {
  const maxMinutes = Math.max(...metrics.map((m) => m.activityMinutes), 60);
  const totalMinutes = metrics.reduce((sum, m) => sum + m.activityMinutes, 0);
  const totalTasks = metrics.reduce((sum, m) => sum + m.tasksCompleted, 0);
  const totalHabits = metrics.reduce((sum, m) => sum + m.habitsCompleted, 0);

  return (
    <Card className="p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] flex items-center justify-center text-[var(--primary)]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] tracking-tight">
              7-Day Activity & Focus Velocity
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Focus time logged, tasks completed, and habits checked over the past 7 days
            </p>
          </div>
        </div>

        {/* Aggregate Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-2.5 py-1 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 shadow-xs">
            <Timer className="w-3.5 h-3.5" />
            <span>{totalMinutes}m logged</span>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] text-xs font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1.5 shadow-xs">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{totalTasks} tasks</span>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 shadow-xs">
            <Flame className="w-3.5 h-3.5" />
            <span>{totalHabits} habits</span>
          </div>
        </div>
      </div>

      {/* 7-Day Bar Chart Grid */}
      <div className="pt-2">
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 sm:h-52 px-2 pb-2">
          {metrics.map((day) => {
            const heightPercent = Math.max(
              8,
              Math.min(100, Math.round((day.activityMinutes / maxMinutes) * 100))
            );

            return (
              <div
                key={day.date}
                className="flex flex-col items-center justify-end h-full group relative"
              >
                {/* Hover Details Tooltip Popup */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-[10px] text-center font-bold px-2.5 py-1 rounded-lg bg-[var(--foreground)] text-[var(--background)] pointer-events-none shadow-md shrink-0 z-20 whitespace-nowrap">
                  <div>{day.activityMinutes} mins focus</div>
                  <div className="opacity-80 text-[9px]">
                    {day.tasksCompleted} tasks &bull; {day.habitsCompleted} habits
                  </div>
                </div>

                {/* Animated Bar Container */}
                <div className="w-full max-w-[40px] flex flex-col justify-end items-center h-full bg-[var(--surface-sub)] rounded-xl p-1 relative overflow-hidden border border-[var(--border-subtle)] group-hover:border-[var(--primary)]/50 transition-colors">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      "w-full rounded-lg transition-all duration-500 relative flex flex-col justify-between items-center py-1",
                      day.isToday
                        ? "bg-gradient-to-t from-[var(--primary)] to-amber-400 shadow-xs"
                        : day.activityMinutes > 0
                        ? "bg-gradient-to-t from-[var(--secondary)] to-teal-400"
                        : "bg-[var(--border)]"
                    )}
                  >
                    {/* Micro badges for tasks and habits */}
                    {day.tasksCompleted > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                    )}
                  </div>
                </div>

                {/* Date Label */}
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      day.isToday
                        ? "text-[var(--primary)] font-extrabold"
                        : "text-[var(--muted-foreground)]"
                    )}
                  >
                    {day.isToday ? "Today" : day.dayLabel}
                  </div>
                  <div className="text-[9px] text-[var(--muted-foreground)]">
                    {day.dayNumber}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
