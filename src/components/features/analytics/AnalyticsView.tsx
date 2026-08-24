"use client";

import * as React from "react";
import { AnalyticsDTO } from "@/types";
import { OverviewCharts } from "./OverviewCharts";
import { TaskAnalyticsCard } from "./TaskAnalyticsCard";
import { HabitAnalyticsCard } from "./HabitAnalyticsCard";
import { ActivityAnalyticsCard } from "./ActivityAnalyticsCard";
import { GoalAnalyticsCard } from "./GoalAnalyticsCard";
import { TrendingUp } from "lucide-react";

interface AnalyticsViewProps {
  analytics: AnalyticsDTO;
}

export function AnalyticsView({ analytics }: AnalyticsViewProps) {
  const {
    weeklyOverview,
    monthlyOverview,
    taskStats,
    habitStats,
    streakStats,
    activityStats,
    goalStats,
    activeDaysStats,
  } = analytics;

  return (
    <div className="space-y-8">
      {/* Analytics Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-indigo-500/20 glass-panel p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Real-Time Performance Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Progress & Consistency Analytics
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              Deterministic, cross-system intelligence computed exclusively from your verified task, habit, activity, and goal records.
            </p>
          </div>

          {/* Quick Metrics KPI Pods */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            {/* Consistency Rate */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center sm:text-right shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Consistency
              </span>
              <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                {activeDaysStats.consistencyScore}%
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                {activeDaysStats.activeDaysPast30Days}/30d active
              </span>
            </div>

            {/* Total Focus */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center sm:text-right shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Total Focus
              </span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {Math.floor(activityStats.totalDurationMinutesAllTime / 60)}h
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                {activityStats.totalActivitiesAllTime} sessions
              </span>
            </div>

            {/* Tasks Done */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center sm:text-right shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Tasks Done
              </span>
              <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400 mt-0.5 block">
                {taskStats.completedTasks}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                {taskStats.completionRate}% rate
              </span>
            </div>

            {/* Top Streak */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center sm:text-right shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Best Streak
              </span>
              <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
                {streakStats.bestCurrentStreak}d
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                Record: {streakStats.bestLongestStreak}d
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts: 7-Day Velocity & 30-Day Heatmap */}
      <OverviewCharts
        weeklyOverview={weeklyOverview}
        monthlyOverview={monthlyOverview}
      />

      {/* Domain Analytics 4-Grid: Tasks, Habits, Activities, Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TaskAnalyticsCard taskStats={taskStats} />
        <HabitAnalyticsCard habitStats={habitStats} streakStats={streakStats} />
        <ActivityAnalyticsCard activityStats={activityStats} />
        <GoalAnalyticsCard goalStats={goalStats} />
      </div>
    </div>
  );
}
