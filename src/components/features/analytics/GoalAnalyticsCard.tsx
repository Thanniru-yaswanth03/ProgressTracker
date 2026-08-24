"use client";

import * as React from "react";
import { GoalStatsDTO } from "@/types";
import { Target } from "lucide-react";

interface GoalAnalyticsCardProps {
  goalStats: GoalStatsDTO;
}

export function GoalAnalyticsCard({ goalStats }: GoalAnalyticsCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>Target Milestones</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Goals & Milestone Progress
          </h2>
        </div>

        <div className="flex items-baseline gap-1 text-right">
          <span className="text-2xl font-extrabold text-indigo-400">
            {goalStats.completionRate}%
          </span>
          <span className="text-xs text-slate-500">achieved</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Total Goals
          </span>
          <span className="text-xl font-bold text-white mt-0.5 block">
            {goalStats.totalGoals}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            In Progress
          </span>
          <span className="text-xl font-bold text-indigo-400 mt-0.5 block">
            {goalStats.inProgressGoals}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Completed
          </span>
          <span className="text-xl font-bold text-emerald-400 mt-0.5 block">
            {goalStats.completedGoals}
          </span>
        </div>
      </div>

      {/* Milestone Progress List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Active Milestone Progress
        </h4>

        {goalStats.goals.length > 0 ? (
          <div className="space-y-2.5">
            {goalStats.goals.slice(0, 4).map((goal) => (
              <div
                key={goal.id}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {goal.section && (
                      <span
                        className="px-1.5 py-0.2 rounded text-[10px] font-semibold border shrink-0"
                        style={{
                          color: goal.section.color,
                          backgroundColor: `${goal.section.color}15`,
                          borderColor: `${goal.section.color}35`,
                        }}
                      >
                        {goal.section.name}
                      </span>
                    )}
                    <span className="font-bold text-white truncate">
                      {goal.title}
                    </span>
                  </div>

                  <span className="font-semibold text-indigo-400 text-[11px] shrink-0">
                    {goal.currentValue} / {goal.targetValue} {goal.unit} ({goal.progressPercentage}%)
                  </span>
                </div>

                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      goal.status === "completed"
                        ? "bg-emerald-500"
                        : "bg-indigo-500"
                    }`}
                    style={{ width: `${goal.progressPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            No goals tracked yet.
          </div>
        )}
      </div>
    </div>
  );
}
