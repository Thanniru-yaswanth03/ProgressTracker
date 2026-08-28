"use client";

import * as React from "react";
import { DayHistoryDTO } from "@/types";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/Card";

interface DayHistoryDetailProps {
  dayHistory: DayHistoryDTO | null;
  isLoading?: boolean;
}

export function DayHistoryDetail({
  dayHistory,
  isLoading = false,
}: DayHistoryDetailProps) {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-[var(--surface-sub)] rounded-lg" />
        <div className="h-20 bg-[var(--surface-sub)] rounded-2xl" />
        <div className="h-32 bg-[var(--surface-sub)] rounded-2xl" />
      </Card>
    );
  }

  if (!dayHistory) {
    return (
      <Card className="border-dashed p-8 text-center text-[var(--muted-foreground)]">
        <Calendar className="w-8 h-8 opacity-30 mx-auto mb-2" />
        <p className="text-xs sm:text-sm">Select a date on the calendar to view historical details.</p>
      </Card>
    );
  }

  const [year, month, day] = dayHistory.date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formattedLongDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasAnyActivity =
    dayHistory.tasksCompleted.length > 0 ||
    dayHistory.activities.length > 0 ||
    dayHistory.habitsCompleted.length > 0 ||
    dayHistory.goalsUpdated.length > 0;

  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-5">
      {/* Date Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {dayHistory.dayLabel} Day Review
            </span>
            {dayHistory.isToday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft-border)]">
                Today
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[var(--foreground)] tracking-tight">
            {formattedLongDate}
          </h2>
        </div>

        {/* Focus Duration Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)]">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-[var(--foreground)]">
            {dayHistory.totalFocusMinutes > 0
              ? `${Math.floor(dayHistory.totalFocusMinutes / 60)}h ${
                  dayHistory.totalFocusMinutes % 60
                }m focused`
              : "0m active focus"}
          </span>
        </div>
      </div>

      {/* Daily Score KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Completion Rate */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
            Daily Score
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-[var(--primary)]">
              {dayHistory.dailyCompletionRate}%
            </span>
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
            Tasks Done
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400">
              {dayHistory.tasksCompleted.length}
            </span>
          </div>
        </div>

        {/* Habits Logged */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
            Habits Logged
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {dayHistory.habitsCompleted.length}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              / {dayHistory.habitsScheduledCount}
            </span>
          </div>
        </div>

        {/* Activities Recorded */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
            Activities
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {dayHistory.activities.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      {hasAnyActivity ? (
        <div className="space-y-5">
          {/* 1. Completed Tasks */}
          {dayHistory.tasksCompleted.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tasks Completed ({dayHistory.tasksCompleted.length})</span>
              </div>
              <div className="space-y-2">
                {dayHistory.tasksCompleted.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        {task.section && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] font-semibold border"
                            style={{
                              color: task.section.color,
                              backgroundColor: `${task.section.color}15`,
                              borderColor: `${task.section.color}35`,
                            }}
                          >
                            {task.section.name}
                          </span>
                        )}
                        <span className="text-xs font-bold text-[var(--foreground)] line-through opacity-80 truncate">
                          {task.title}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Recorded Activities Timeline */}
          {dayHistory.activities.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>Recorded Activities ({dayHistory.activities.length})</span>
              </div>
              <div className="space-y-2">
                {dayHistory.activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] flex flex-col gap-1.5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {act.section && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] font-semibold border"
                            style={{
                              color: act.section.color,
                              backgroundColor: `${act.section.color}15`,
                              borderColor: `${act.section.color}35`,
                            }}
                          >
                            {act.section.name}
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-[var(--foreground)]">
                          {act.title}
                        </h4>
                      </div>

                      {act.duration !== undefined && act.duration !== null && act.duration > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                          {act.duration} mins
                        </span>
                      )}
                    </div>

                    {act.description && (
                      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                        {act.description}
                      </p>
                    )}

                    {act.tags && act.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {act.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-[var(--muted-foreground)] bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Habits Logged */}
          {dayHistory.habitsCompleted.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Flame className="w-4 h-4" />
                <span>Habits Completed ({dayHistory.habitsCompleted.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dayHistory.habitsCompleted.map((habit) => (
                  <div
                    key={habit.id}
                    className="p-3 rounded-xl bg-[var(--surface-sub)] border border-amber-500/25 flex items-center justify-between gap-2 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[var(--foreground)] truncate">
                        {habit.title}
                      </h4>
                      <span className="text-[10px] text-[var(--muted-foreground)] uppercase">
                        {habit.frequency}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{habit.streak.currentStreak}d</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Goal Progress Updates */}
          {dayHistory.goalsUpdated.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                <Target className="w-4 h-4" />
                <span>Goals Progressed ({dayHistory.goalsUpdated.length})</span>
              </div>
              <div className="space-y-2">
                {dayHistory.goalsUpdated.map((goal) => (
                  <div
                    key={goal.id}
                    className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--primary)]/20 space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--foreground)]">{goal.title}</span>
                      <span className="font-semibold text-[var(--primary)]">
                        {goal.currentValue} / {goal.targetValue} {goal.unit} ({goal.progressPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)] rounded-full"
                        style={{ width: `${goal.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State for Inactive Days */
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-sub)]/50">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-sub)] flex items-center justify-center text-[var(--muted-foreground)] mx-auto mb-2">
            <Zap className="w-5 h-5 opacity-40" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)]">No activity logged</h4>
          <p className="text-xs text-[var(--muted-foreground)] max-w-xs mx-auto mt-1">
            No completed tasks, focus activities, or habit check-ins recorded on this day.
          </p>
        </div>
      )}
    </Card>
  );
}
