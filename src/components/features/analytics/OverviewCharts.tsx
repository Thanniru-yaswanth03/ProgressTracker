"use client";

import * as React from "react";
import { WeeklyOverviewDTO, MonthlyOverviewDTO } from "@/types";
import { BarChart3, Clock, Flame, CheckSquare } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface OverviewChartsProps {
  weeklyOverview: WeeklyOverviewDTO;
  monthlyOverview: MonthlyOverviewDTO;
}

export function OverviewCharts({
  weeklyOverview,
  monthlyOverview,
}: OverviewChartsProps) {
  const [metricTab, setMetricTab] = React.useState<"focus" | "tasks" | "habits">(
    "focus"
  );
  const [timeframeTab, setTimeframeTab] = React.useState<"weekly" | "monthly">(
    "weekly"
  );

  // Compute max values for chart height normalization
  const maxWeeklyFocus = Math.max(
    ...weeklyOverview.days.map((d) => d.activityMinutes),
    60
  );
  const maxWeeklyTasks = Math.max(
    ...weeklyOverview.days.map((d) => d.tasksCompleted),
    5
  );
  const maxWeeklyHabits = Math.max(
    ...weeklyOverview.days.map((d) => d.habitsCompleted),
    5
  );

  const maxMonthlyFocus = Math.max(
    ...monthlyOverview.weekTrends.map((w) => w.focusMinutes),
    120
  );
  const maxMonthlyTasks = Math.max(
    ...monthlyOverview.weekTrends.map((w) => w.tasksCompleted),
    10
  );
  const maxMonthlyHabits = Math.max(
    ...monthlyOverview.weekTrends.map((w) => w.habitsCompleted),
    10
  );

  return (
    <Card className="p-5 sm:p-6 space-y-6">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Progress Velocity</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight">
            {timeframeTab === "weekly" ? "7-Day Activity Trends" : "4-Week Monthly Trajectory"}
          </h2>
        </div>

        {/* Timeframe & Metric Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--surface-sub)] border border-[var(--border)] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMetricTab("focus")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                metricTab === "focus"
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Focus</span>
            </button>

            <button
              type="button"
              onClick={() => setMetricTab("tasks")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                metricTab === "tasks"
                  ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-bold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tasks</span>
            </button>

            <button
              type="button"
              onClick={() => setMetricTab("habits")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                metricTab === "habits"
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Habits</span>
            </button>
          </div>

          {/* Timeframe Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--surface-sub)] border border-[var(--border)] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTimeframeTab("weekly")}
              className={cn(
                "px-3 py-1 rounded-lg transition-all cursor-pointer",
                timeframeTab === "weekly"
                  ? "bg-[var(--primary)] text-white shadow-xs font-bold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframeTab("monthly")}
              className={cn(
                "px-3 py-1 rounded-lg transition-all cursor-pointer",
                timeframeTab === "monthly"
                  ? "bg-[var(--primary)] text-white shadow-xs font-bold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              4 Weeks
            </button>
          </div>
        </div>
      </div>

      {/* Chart Visualizer */}
      {timeframeTab === "weekly" ? (
        /* 7-Day Chart */
        <div className="space-y-4">
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2">
            {weeklyOverview.days.map((day) => {
              let val = 0;
              let max = 1;
              let barColor = "bg-emerald-500";
              let label = `${day.activityMinutes}m`;

              if (metricTab === "focus") {
                val = day.activityMinutes;
                max = maxWeeklyFocus;
                barColor = "bg-gradient-to-t from-emerald-600 to-emerald-400";
                label = `${val}m`;
              } else if (metricTab === "tasks") {
                val = day.tasksCompleted;
                max = maxWeeklyTasks;
                barColor = "bg-gradient-to-t from-sky-600 to-sky-400";
                label = `${val}`;
              } else {
                val = day.habitsCompleted;
                max = maxWeeklyHabits;
                barColor = "bg-gradient-to-t from-amber-600 to-amber-400";
                label = `${val}`;
              }

              const heightPercent = Math.max(8, Math.round((val / max) * 100));

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 px-2 py-1 rounded-md bg-[var(--foreground)] text-[var(--background)] text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-md">
                    {day.dayLabel} ({day.date}): {label}
                  </div>

                  {/* Value label above bar */}
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] mb-1 opacity-80 group-hover:text-[var(--foreground)] transition-colors">
                    {val > 0 ? label : "0"}
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[36px] bg-[var(--surface-sub)] rounded-xl overflow-hidden p-0.5 border border-[var(--border-subtle)] flex items-end">
                    <div
                      className={cn("w-full rounded-lg transition-all duration-500 shadow-xs", barColor)}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Day Label Footer */}
                  <span
                    className={cn(
                      "text-[10px] sm:text-[11px] font-bold mt-2",
                      day.isToday ? "text-[var(--primary)] font-extrabold" : "text-[var(--muted-foreground)]"
                    )}
                  >
                    {day.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Weekly Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--border-subtle)] text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] shadow-xs">
              <span className="text-[var(--muted-foreground)] block text-[10px] uppercase font-semibold">
                Total Focus
              </span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {Math.floor(weeklyOverview.totalFocusMinutes / 60)}h{" "}
                {weeklyOverview.totalFocusMinutes % 60}m
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] shadow-xs">
              <span className="text-[var(--muted-foreground)] block text-[10px] uppercase font-semibold">
                Tasks Completed
              </span>
              <span className="text-sm sm:text-base font-extrabold text-sky-600 dark:text-sky-400 mt-0.5 block">
                {weeklyOverview.totalTasksCompleted} tasks
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] shadow-xs">
              <span className="text-[var(--muted-foreground)] block text-[10px] uppercase font-semibold">
                Habits Logged
              </span>
              <span className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
                {weeklyOverview.totalHabitsCompleted} check-ins
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] shadow-xs">
              <span className="text-[var(--muted-foreground)] block text-[10px] uppercase font-semibold">
                Active Days
              </span>
              <span className="text-sm sm:text-base font-extrabold text-[var(--primary)] mt-0.5 block">
                {weeklyOverview.activeDaysCount} / 7 days
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* 4-Week Monthly Chart */
        <div className="space-y-4">
          <div className="h-44 flex items-end justify-between gap-4 pt-6 pb-2">
            {monthlyOverview.weekTrends.map((wt) => {
              let val = 0;
              let max = 1;
              let barColor = "bg-emerald-500";
              let label = `${wt.focusMinutes}m`;

              if (metricTab === "focus") {
                val = wt.focusMinutes;
                max = maxMonthlyFocus;
                barColor = "bg-gradient-to-t from-emerald-600 to-emerald-400";
                label = `${Math.floor(val / 60)}h ${val % 60}m`;
              } else if (metricTab === "tasks") {
                val = wt.tasksCompleted;
                max = maxMonthlyTasks;
                barColor = "bg-gradient-to-t from-sky-600 to-sky-400";
                label = `${val} tasks`;
              } else {
                val = wt.habitsCompleted;
                max = maxMonthlyHabits;
                barColor = "bg-gradient-to-t from-amber-600 to-amber-400";
                label = `${val} logs`;
              }

              const heightPercent = Math.max(8, Math.round((val / max) * 100));

              return (
                <div
                  key={wt.weekLabel}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <div className="absolute -top-8 px-2 py-1 rounded-md bg-[var(--foreground)] text-[var(--background)] text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-md">
                    {wt.startDate} to {wt.endDate}: {label}
                  </div>

                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] mb-1 opacity-80 group-hover:text-[var(--foreground)] transition-colors">
                    {val > 0 ? label : "0"}
                  </span>

                  <div className="w-full max-w-[56px] bg-[var(--surface-sub)] rounded-xl overflow-hidden p-0.5 border border-[var(--border-subtle)] flex items-end">
                    <div
                      className={cn("w-full rounded-lg transition-all duration-500 shadow-xs", barColor)}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  <span className="text-[11px] font-bold mt-2 text-[var(--muted-foreground)]">
                    {wt.weekLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Monthly Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--border-subtle)] text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] shadow-xs">
              <span className="text-[var(--muted-foreground)] block text-[10px] uppercase font-semibold">
                30-Day Focus
              </span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {Math.floor(monthlyOverview.totalFocusMinutes / 60)}h{" "}
                {monthlyOverview.totalFocusMinutes % 60}m
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] shadow-xs">
              <span className="text-[var(--muted-foreground)] block text-[10px] uppercase font-semibold">
                Tasks Completed
              </span>
              <span className="text-sm sm:text-base font-extrabold text-sky-600 dark:text-sky-400 mt-0.5 block">
                {monthlyOverview.totalTasksCompleted} tasks
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] shadow-xs">
              <span className="text-[var(--muted-foreground)] block text-[10px] uppercase font-semibold">
                Habits Logged
              </span>
              <span className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
                {monthlyOverview.totalHabitsCompleted} check-ins
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] shadow-xs">
              <span className="text-[var(--muted-foreground)] block text-[10px] uppercase font-semibold">
                Monthly Consistency
              </span>
              <span className="text-sm sm:text-base font-extrabold text-[var(--primary)] mt-0.5 block">
                {monthlyOverview.consistencyRate}% ({monthlyOverview.activeDaysCount}/30d)
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
