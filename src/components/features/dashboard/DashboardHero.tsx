"use client";

import * as React from "react";
import { CheckSquare, Flame, Sparkles, Timer } from "lucide-react";
import { DashboardDataDTO } from "@/types";

export interface DashboardHeroProps {
  userName: string;
  data: DashboardDataDTO;
}

export function DashboardHero({ userName, data }: DashboardHeroProps) {
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const rate = data.dailyCompletionRate;
  // Circumference for r=38 -> 2 * PI * 38 = 238.76
  const circumference = 238.76;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 glass-panel shadow-xl dark:shadow-2xl transition-all duration-300">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-500/15 via-sky-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        {/* Left: Greeting & Date */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Daily Command Center</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Authenticated Session Active
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-600 to-amber-500 dark:from-indigo-400 dark:via-sky-300 dark:to-amber-300">{userName}</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {todayFormatted} &bull; Here is your live productivity and streak progress overview.
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <CheckSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Today&apos;s Tasks</span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {data.todayTasksCompleted} <span className="text-xs text-slate-500 font-normal">/ {data.todayTasksTotal}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Habits Done</span>
              </div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                {data.todayHabitsCompleted} <span className="text-xs text-slate-500 font-normal">/ {data.todayHabitsTotal}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <Timer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Focus Logged</span>
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {data.todayActivitiesMinutes} <span className="text-xs text-slate-500 font-normal">mins</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Active Habits</span>
              </div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-300 mt-1">
                {data.activeHabits.length}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Circular Daily Completion Gauge */}
        <div className="flex flex-row lg:flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shrink-0 gap-4 min-w-[200px] shadow-xs">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r="38"
                className="stroke-slate-200 dark:stroke-slate-800 fill-none"
                strokeWidth="7"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="50"
                cy="50"
                r="38"
                className="stroke-indigo-600 dark:stroke-indigo-500 fill-none transition-all duration-700 ease-out"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {rate}%
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Daily Goal
              </span>
            </div>
          </div>

          <div className="text-left lg:text-center">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {rate === 100 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  All Goals Smashed! 🎉
                </span>
              ) : rate >= 50 ? (
                <span className="text-sky-600 dark:text-sky-400">Over Halfway There! 🚀</span>
              ) : (
                <span className="text-slate-700 dark:text-slate-300">Keep The Momentum! ✨</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {data.todayTasksCompleted + data.todayHabitsCompleted} of{" "}
              {data.todayTasksTotal + data.todayHabitsTotal} daily items done
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
