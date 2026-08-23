"use client";

import * as React from "react";
import { HabitDTO } from "@/types";
import { Card } from "@/components/ui/Card";
import { Award, CheckCircle2, Flame, Repeat } from "lucide-react";

export interface HabitStatsHeaderProps {
  habits: HabitDTO[];
}

export function HabitStatsHeader({ habits }: HabitStatsHeaderProps) {
  const activeHabits = habits.filter((h) => !h.archived);
  const totalActive = activeHabits.length;

  const maxCurrentStreak = activeHabits.reduce(
    (max, h) => Math.max(max, h.streak.currentStreak),
    0
  );

  const maxAllTimeStreak = activeHabits.reduce(
    (max, h) => Math.max(max, h.streak.longestStreak),
    0
  );

  const completedTodayCount = activeHabits.filter(
    (h) => h.streak.isCompletedToday
  ).length;

  const todayPercentage =
    totalActive > 0 ? Math.round((completedTodayCount / totalActive) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Habits */}
      <Card className="p-4 flex items-center gap-3.5 border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
          <Repeat className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Active Habits
          </div>
          <div className="text-xl font-extrabold text-white mt-0.5">{totalActive}</div>
        </div>
      </Card>

      {/* Best Active Streak */}
      <Card className="p-4 flex items-center gap-3.5 border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
          <Flame className="w-5 h-5 fill-orange-400/20" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Best Active Streak
          </div>
          <div className="text-xl font-extrabold text-orange-400 mt-0.5">
            {maxCurrentStreak} day{maxCurrentStreak === 1 ? "" : "s"}
          </div>
        </div>
      </Card>

      {/* All-Time Peak Record */}
      <Card className="p-4 flex items-center gap-3.5 border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Peak Record Streak
          </div>
          <div className="text-xl font-extrabold text-indigo-400 mt-0.5">
            {maxAllTimeStreak} day{maxAllTimeStreak === 1 ? "" : "s"}
          </div>
        </div>
      </Card>

      {/* Completed Today */}
      <Card className="p-4 flex items-center gap-3.5 border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Done Today
            </span>
            <span className="text-[10px] font-bold text-emerald-400">
              {todayPercentage}%
            </span>
          </div>
          <div className="text-xl font-extrabold text-white mt-0.5">
            {completedTodayCount} / {totalActive}
          </div>
        </div>
      </Card>
    </div>
  );
}
