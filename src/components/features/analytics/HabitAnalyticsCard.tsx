"use client";

import * as React from "react";
import { HabitStatsDTO, StreakStatsDTO } from "@/types";
import { Flame, Trophy } from "lucide-react";

interface HabitAnalyticsCardProps {
  habitStats: HabitStatsDTO;
  streakStats: StreakStatsDTO;
}

export function HabitAnalyticsCard({
  habitStats,
  streakStats,
}: HabitAnalyticsCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4" />
            <span>Consistency Engine</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Habits & Streak Leaderboard
          </h2>
        </div>

        <div className="flex items-baseline gap-1 text-right">
          <span className="text-2xl font-extrabold text-amber-400">
            {habitStats.overallCompletionRate}%
          </span>
          <span className="text-xs text-slate-500">rate</span>
        </div>
      </div>

      {/* Streak Champions Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Current Best Streak */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-950/80 border border-amber-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-amber-400/80 block">
              Active Streak Best
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white">
                {streakStats.bestCurrentStreak} days
              </span>
            </div>
            {streakStats.bestCurrentHabitTitle && (
              <p className="text-[11px] text-slate-400 truncate">
                {streakStats.bestCurrentHabitTitle}
              </p>
            )}
          </div>
        </div>

        {/* All-Time Record Streak */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-950/80 border border-indigo-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-indigo-400/80 block">
              All-Time Record
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white">
                {streakStats.bestLongestStreak} days
              </span>
            </div>
            {streakStats.bestLongestHabitTitle && (
              <p className="text-[11px] text-slate-400 truncate">
                {streakStats.bestLongestHabitTitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Habit Performance List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Individual Habit Consistency (Past 30 Days)
        </h4>

        {habitStats.habitsPerformance.length > 0 ? (
          <div className="space-y-2">
            {habitStats.habitsPerformance.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {h.section && (
                      <span
                        className="px-1.5 py-0.2 rounded text-[10px] font-semibold border"
                        style={{
                          color: h.section.color,
                          backgroundColor: `${h.section.color}15`,
                          borderColor: `${h.section.color}35`,
                        }}
                      >
                        {h.section.name}
                      </span>
                    )}
                    <h5 className="text-xs font-bold text-white truncate">
                      {h.title}
                    </h5>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Flame className="w-3 h-3" />
                      {h.currentStreak}d current
                    </span>
                    <span className="text-slate-500">&bull;</span>
                    <span>{h.past30DaysLogsCount} / {h.past30DaysScheduledCount} in 30d</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold text-amber-400 block">
                    {h.completionRate}%
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">
                    success
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            No habits defined yet.
          </div>
        )}
      </div>
    </div>
  );
}
