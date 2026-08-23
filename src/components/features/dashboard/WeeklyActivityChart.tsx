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
    <Card className="p-5 sm:p-6 border-slate-800/80 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              7-Day Activity & Focus Chart
            </h3>
            <p className="text-xs text-slate-400">
              Minutes logged, tasks finished, and habits completed across the past week
            </p>
          </div>
        </div>

        {/* Aggregate Badges */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5" />
            <span>{totalMinutes}m logged</span>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-sky-400 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{totalTasks} tasks</span>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-amber-400 flex items-center gap-1.5">
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
                className="flex flex-col items-center justify-end h-full group"
              >
                {/* Hover Details Tooltip Popup */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-[10px] text-center font-bold px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 pointer-events-none shadow-xl shrink-0 z-20">
                  <div>{day.activityMinutes} mins</div>
                  <div className="text-slate-400 text-[9px]">
                    {day.tasksCompleted}t &bull; {day.habitsCompleted}h
                  </div>
                </div>

                {/* Animated Bar */}
                <div className="w-full max-w-[36px] flex flex-col justify-end items-center h-full bg-slate-900/60 rounded-xl p-1 relative overflow-hidden border border-slate-800 group-hover:border-indigo-500/50 transition-colors">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      "w-full rounded-lg transition-all duration-500 relative flex flex-col justify-between items-center py-1",
                      day.isToday
                        ? "bg-gradient-to-t from-indigo-600 via-sky-500 to-amber-400 shadow-lg shadow-indigo-500/30"
                        : day.activityMinutes > 0
                        ? "bg-gradient-to-t from-indigo-600/80 to-sky-500/80"
                        : "bg-slate-800/40"
                    )}
                  >
                    {/* Micro badges for tasks and habits */}
                    {day.tasksCompleted > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                    )}
                  </div>
                </div>

                {/* Date Label */}
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider",
                      day.isToday ? "text-indigo-400 font-bold" : "text-slate-400"
                    )}
                  >
                    {day.isToday ? "Today" : day.dayLabel}
                  </div>
                  <div className="text-[9px] text-slate-500">
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
