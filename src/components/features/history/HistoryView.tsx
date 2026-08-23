"use client";

import * as React from "react";
import { MonthHistoryDTO, DayHistoryDTO } from "@/types";
import { CalendarGrid } from "./CalendarGrid";
import { DayHistoryDetail } from "./DayHistoryDetail";
import { Calendar, History, Sparkles, TrendingUp, Zap } from "lucide-react";
import { formatDateKey, shiftDate } from "@/server/services/streak.service";

interface HistoryViewProps {
  initialMonthData: MonthHistoryDTO;
  initialDayHistory: DayHistoryDTO;
}

export function HistoryView({
  initialMonthData,
  initialDayHistory,
}: HistoryViewProps) {
  const [selectedDate, setSelectedDate] = React.useState<string>(
    initialDayHistory.date
  );
  const [currentMonth, setCurrentMonth] = React.useState<string>(
    initialMonthData.yearMonth
  );

  const [monthData, setMonthData] = React.useState<MonthHistoryDTO>(
    initialMonthData
  );
  const [dayHistory, setDayHistory] = React.useState<DayHistoryDTO | null>(
    initialDayHistory
  );

  const [isLoadingDay, setIsLoadingDay] = React.useState(false);
  const [isLoadingMonth, setIsLoadingMonth] = React.useState(false);

  // Fetch new day history when selected date changes
  const handleSelectDate = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsLoadingDay(true);

    try {
      const res = await fetch(`/api/history/day?date=${dateStr}`);
      if (res.ok) {
        const json = await res.json();
        setDayHistory(json.data);
      }
    } catch (err) {
      console.error("Failed to load day history:", err);
    } finally {
      setIsLoadingDay(false);
    }
  };

  // Fetch month summary when navigating months
  const loadMonth = async (yearMonthStr: string) => {
    setCurrentMonth(yearMonthStr);
    setIsLoadingMonth(true);

    try {
      const res = await fetch(`/api/history/month?month=${yearMonthStr}`);
      if (res.ok) {
        const json = await res.json();
        setMonthData(json.data);
      }
    } catch (err) {
      console.error("Failed to load month history:", err);
    } finally {
      setIsLoadingMonth(false);
    }
  };

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, "0");
    loadMonth(`${prevYear}-${prevMonth}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    const nextDate = new Date(year, month, 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
    loadMonth(`${nextYear}-${nextMonth}`);
  };

  const handleToday = () => {
    const todayStr = formatDateKey(new Date());
    const todayMonth = todayStr.slice(0, 7);

    if (todayMonth !== currentMonth) {
      loadMonth(todayMonth);
    }
    handleSelectDate(todayStr);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4" />
              <span>Timeline & Consistency</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Activity History & Calendar
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Inspect historical records, completed tasks, focus activities, and daily consistency scores.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Month Focus
              </span>
              <span className="text-sm font-extrabold text-emerald-400">
                {Math.floor(monthData.totalFocusMinutes / 60)}h{" "}
                {monthData.totalFocusMinutes % 60}m
              </span>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Active Days
              </span>
              <span className="text-sm font-extrabold text-indigo-400">
                {monthData.activeDaysCount} days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid on Left (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <CalendarGrid
            monthData={monthData}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            isLoadingMonth={isLoadingMonth}
          />
        </div>

        {/* Day Detail on Right (7 Cols) */}
        <div className="lg:col-span-7">
          <DayHistoryDetail
            dayHistory={dayHistory}
            isLoading={isLoadingDay}
          />
        </div>
      </div>
    </div>
  );
}
