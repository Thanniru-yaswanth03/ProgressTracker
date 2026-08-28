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
    <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] transition-all duration-200">
      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        {/* Left: Greeting & Date */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
            <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            <span>Daily Command Center</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Live Verified Data
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
              Welcome back, <span className="text-[var(--primary)]">{userName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
              {todayFormatted} &bull; Here is your momentum overview and execution progress today.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--muted-foreground)]">
                <CheckSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Today&apos;s Tasks</span>
              </div>
              <div className="text-lg font-bold text-[var(--foreground)] mt-1">
                {data.todayTasksCompleted}{" "}
                <span className="text-xs text-[var(--muted-foreground)] font-normal">
                  / {data.todayTasksTotal}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--muted-foreground)]">
                <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Habits Done</span>
              </div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                {data.todayHabitsCompleted}{" "}
                <span className="text-xs text-[var(--muted-foreground)] font-normal">
                  / {data.todayHabitsTotal}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--muted-foreground)]">
                <Timer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Focus Logged</span>
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {data.todayActivitiesMinutes}{" "}
                <span className="text-xs text-[var(--muted-foreground)] font-normal">
                  mins
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--muted-foreground)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Active Habits</span>
              </div>
              <div className="text-lg font-bold text-[var(--primary)] mt-1">
                {data.activeHabits.length}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Circular Daily Completion Gauge */}
        <div className="flex flex-row lg:flex-col items-center justify-center p-5 rounded-2xl bg-[var(--surface-sub)] border border-[var(--border)] shrink-0 gap-4 min-w-[210px] shadow-xs">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r="38"
                className="stroke-[var(--border)] fill-none"
                strokeWidth="7"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="50"
                cy="50"
                r="38"
                className="stroke-[var(--primary)] fill-none transition-all duration-700 ease-out"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
                {rate}%
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--muted-foreground)]">
                Daily Goal
              </span>
            </div>
          </div>

          <div className="text-left lg:text-center">
            <div className="text-xs font-bold text-[var(--foreground)]">
              {rate === 100 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-center">
                  All Goals Smashed! 🎉
                </span>
              ) : rate >= 50 ? (
                <span className="text-[var(--primary)]">Over Halfway There! 🚀</span>
              ) : (
                <span className="text-[var(--foreground)]">Keep The Momentum! ✨</span>
              )}
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
              {data.todayTasksCompleted + data.todayHabitsCompleted} of{" "}
              {data.todayTasksTotal + data.todayHabitsTotal} daily items done
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
