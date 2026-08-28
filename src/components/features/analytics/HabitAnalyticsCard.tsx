"use client";

import * as React from "react";
import { HabitStatsDTO, StreakStatsDTO } from "@/types";
import { Flame, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface HabitAnalyticsCardProps {
  habitStats: HabitStatsDTO;
  streakStats: StreakStatsDTO;
}

export function HabitAnalyticsCard({
  habitStats,
  streakStats,
}: HabitAnalyticsCardProps) {
  return (
    <Card className="p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4" />
            <span>Consistency Engine</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight">
            Habits & Streak Leaderboard
          </h2>
        </div>

        <div className="flex items-baseline gap-1 text-right">
          <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {habitStats.overallCompletionRate}%
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">rate</span>
        </div>
      </div>

      {/* Streak Champions Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Current Best Streak */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
              Active Streak Best
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-extrabold text-[var(--foreground)]">
                {streakStats.bestCurrentStreak} days
              </span>
            </div>
            {streakStats.bestCurrentHabitTitle && (
              <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                {streakStats.bestCurrentHabitTitle}
              </p>
            )}
          </div>
        </div>

        {/* All-Time Record Streak */}
        <div className="p-3.5 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/20 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-[var(--primary)] block">
              All-Time Record
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-extrabold text-[var(--foreground)]">
                {streakStats.bestLongestStreak} days
              </span>
            </div>
            {streakStats.bestLongestHabitTitle && (
              <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                {streakStats.bestLongestHabitTitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Habit Performance List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
          Individual Habit Consistency (Past 30 Days)
        </h4>

        {habitStats.habitsPerformance.length > 0 ? (
          <div className="space-y-2">
            {habitStats.habitsPerformance.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {h.section && (
                      <span
                        className="px-1.5 py-0.2 rounded text-[10px] font-semibold border"
                        style={{
                          color: h.section.color || "var(--primary)",
                          backgroundColor: `${h.section.color || "#ea580c"}15`,
                          borderColor: `${h.section.color || "#ea580c"}35`,
                        }}
                      >
                        {h.section.name}
                      </span>
                    )}
                    <h5 className="text-xs font-bold text-[var(--foreground)] truncate">
                      {h.title}
                    </h5>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                      <Flame className="w-3 h-3" />
                      {h.currentStreak}d current
                    </span>
                    <span>&bull;</span>
                    <span>{h.past30DaysLogsCount} / {h.past30DaysScheduledCount} in 30d</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 block">
                    {h.completionRate}%
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)] uppercase">
                    success
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-[var(--muted-foreground)] bg-[var(--surface-sub)] rounded-xl border border-dashed border-[var(--border)]">
            No habits defined yet.
          </div>
        )}
      </div>
    </Card>
  );
}
