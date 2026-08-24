"use client";

import * as React from "react";
import { MonthHistoryDTO } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 glass-panel p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{monthData.monthName}</span>
            {isLoadingMonth && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {monthData.activeDaysCount} active days &bull; {monthData.totalTasksCompleted} tasks &bull; {monthData.totalHabitsCompleted} habits
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToday}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Today
          </button>

          <button
            type="button"
            onClick={onPrevMonth}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onNextMonth}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
            className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1"
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
            className="min-h-[52px] sm:min-h-[64px] rounded-2xl border border-transparent bg-slate-100/40 dark:bg-slate-950/20 opacity-30"
          />
        ))}

        {/* Day Cells */}
        {monthData.days.map((day) => {
          const isSelected = day.date === selectedDate;
          const isToday = day.isToday;
          const hasActivity = day.hasActivity;
          const rate = day.dailyCompletionRate;

          // Heat styling based on daily completion & activities
          let bgClass = "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850/80 hover:border-slate-300 dark:hover:border-slate-700";
          let badgeColor = "text-slate-500 dark:text-slate-400";

          if (rate >= 100) {
            bgClass = "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-500/50";
            badgeColor = "text-emerald-600 dark:text-emerald-400 font-bold";
          } else if (rate >= 50) {
            bgClass = "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-500/30 hover:border-indigo-500/50";
            badgeColor = "text-indigo-600 dark:text-indigo-400 font-semibold";
          } else if (rate > 0 || hasActivity) {
            bgClass = "bg-sky-50 dark:bg-sky-950/25 border-sky-300 dark:border-sky-500/20 hover:border-sky-500/40";
            badgeColor = "text-sky-600 dark:text-sky-400";
          }

          if (isSelected) {
            bgClass = "bg-indigo-100 dark:bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10";
          }

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
              className={`group relative flex flex-col justify-between p-1.5 sm:p-2.5 min-h-[56px] sm:min-h-[68px] rounded-2xl border transition-all text-left cursor-pointer ${bgClass}`}
            >
              {/* Day Number and Today Indicator */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs sm:text-sm font-bold tracking-tight ${
                    isToday
                      ? "px-1.5 py-0.2 rounded-md bg-indigo-600 text-white font-extrabold shadow-sm"
                      : isSelected
                      ? "text-indigo-700 dark:text-indigo-200 font-bold"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {day.dayNumber}
                </span>

                {rate > 0 && (
                  <span className={`text-[10px] hidden sm:inline-block ${badgeColor}`}>
                    {rate}%
                  </span>
                )}
              </div>

              {/* Bottom Indicators */}
              <div className="flex items-center gap-1 mt-1">
                {day.tasksCompletedCount > 0 && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400"
                    title={`${day.tasksCompletedCount} tasks completed`}
                  />
                )}
                {day.habitsCompletedCount > 0 && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400"
                    title={`${day.habitsCompletedCount} habits logged`}
                  />
                )}
                {day.activitiesCount > 0 && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
                    title={`${day.activitiesCount} activities (${day.focusMinutes}m)`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400" />
            <span>Tasks Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span>Habits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span>Activities</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span>Heat:</span>
          <span className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700" title="0%" />
          <span className="w-2.5 h-2.5 rounded bg-sky-100 dark:bg-sky-950 border border-sky-400 dark:border-sky-600/40" title="1-49%" />
          <span className="w-2.5 h-2.5 rounded bg-indigo-100 dark:bg-indigo-950 border border-indigo-400 dark:border-indigo-500/60" title="50-99%" />
          <span className="w-2.5 h-2.5 rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-500" title="100%" />
        </div>
      </div>
    </div>
  );
}
