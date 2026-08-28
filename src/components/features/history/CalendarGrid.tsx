"use client";

import * as React from "react";
import { MonthHistoryDTO } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  monthData: MonthHistoryDTO;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  isLoadingMonth?: boolean;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  monthData,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  isLoadingMonth = false,
}: CalendarGridProps) {
  // Compute padding for the 1st day of month (0 = Sun, 1 = Mon...)
  const firstDayOfMonth = React.useMemo(() => {
    const [year, month] = monthData.yearMonth.split("-").map(Number);
    return new Date(year, month - 1, 1).getDay();
  }, [monthData.yearMonth]);

  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between gap-3 mb-5 pb-3.5 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
            <span>{monthData.monthName}</span>
            {isLoadingMonth && (
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-ping" />
            )}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {monthData.activeDaysCount} active days &bull; {monthData.totalTasksCompleted} tasks &bull; {monthData.totalHabitsCompleted} habits
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToday}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[var(--surface-sub)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors cursor-pointer shadow-xs"
          >
            Today
          </button>

          <button
            type="button"
            onClick={onPrevMonth}
            className="p-1.5 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onNextMonth}
            className="p-1.5 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider py-1"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Leading Empty Cells */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="min-h-[48px] sm:min-h-[60px] rounded-xl border border-transparent bg-[var(--surface-sub)] opacity-20"
          />
        ))}

        {/* Day Cells */}
        {monthData.days.map((day) => {
          const isSelected = day.date === selectedDate;
          const isToday = day.isToday;
          const hasActivity = day.hasActivity;
          const rate = day.dailyCompletionRate;

          // Heat styling based on daily completion & activities
          let bgClass = "bg-[var(--surface-sub)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]";
          let badgeColor = "text-[var(--muted-foreground)]";

          if (rate >= 100) {
            bgClass = "bg-emerald-500/15 border-emerald-500/30 hover:border-emerald-500/50";
            badgeColor = "text-emerald-700 dark:text-emerald-400 font-bold";
          } else if (rate >= 50) {
            bgClass = "bg-orange-500/15 border-orange-500/30 hover:border-orange-500/50";
            badgeColor = "text-orange-700 dark:text-orange-400 font-semibold";
          } else if (rate > 0 || hasActivity) {
            bgClass = "bg-sky-500/10 border-sky-500/20 hover:border-sky-500/40";
            badgeColor = "text-sky-700 dark:text-sky-400";
          }

          if (isSelected) {
            bgClass = "bg-[var(--primary-soft)] border-[var(--primary)] ring-2 ring-[var(--ring)]/40 shadow-xs";
          }

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
              className={cn(
                "group relative flex flex-col justify-between p-1.5 sm:p-2 min-h-[50px] sm:min-h-[62px] rounded-xl border transition-all text-left cursor-pointer",
                bgClass
              )}
            >
              {/* Day Number and Today Indicator */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    "text-xs font-bold tracking-tight",
                    isToday
                      ? "px-1.5 py-0.2 rounded-md bg-[var(--primary)] text-white font-extrabold shadow-xs"
                      : isSelected
                      ? "text-[var(--primary)] font-bold"
                      : "text-[var(--foreground)]"
                  )}
                >
                  {day.dayNumber}
                </span>

                {rate > 0 && (
                  <span className={cn("text-[9px] hidden sm:inline-block font-mono", badgeColor)}>
                    {rate}%
                  </span>
                )}
              </div>

              {/* Bottom Indicators */}
              <div className="flex items-center gap-1 mt-1">
                {day.tasksCompletedCount > 0 && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-sky-500"
                    title={`${day.tasksCompletedCount} tasks completed`}
                  />
                )}
                {day.habitsCompletedCount > 0 && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-500"
                    title={`${day.habitsCompletedCount} habits logged`}
                  />
                )}
                {day.activitiesCount > 0 && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                    title={`${day.activitiesCount} activities (${day.focusMinutes}m)`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-[10px] text-[var(--muted-foreground)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Tasks Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Habits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Activities</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span>Heat:</span>
          <span className="w-2.5 h-2.5 rounded bg-[var(--surface-sub)] border border-[var(--border)]" title="0%" />
          <span className="w-2.5 h-2.5 rounded bg-sky-500/20 border border-sky-500/40" title="1-49%" />
          <span className="w-2.5 h-2.5 rounded bg-orange-500/20 border border-orange-500/40" title="50-99%" />
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/25 border border-emerald-500/50" title="100%" />
        </div>
      </div>
    </Card>
  );
}
