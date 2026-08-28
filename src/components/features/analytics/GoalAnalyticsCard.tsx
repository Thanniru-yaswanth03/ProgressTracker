"use client";

import * as React from "react";
import { GoalStatsDTO } from "@/types";
import { Target } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface GoalAnalyticsCardProps {
  goalStats: GoalStatsDTO;
}

export function GoalAnalyticsCard({ goalStats }: GoalAnalyticsCardProps) {
  return (
    <Card className="p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>Target Milestones</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight">
            Goals & Milestone Progress
          </h2>
        </div>

        <div className="flex items-baseline gap-1 text-right">
          <span className="text-xl sm:text-2xl font-extrabold text-[var(--primary)]">
            {goalStats.completionRate}%
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">achieved</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] text-center shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
            Total Goals
          </span>
          <span className="text-lg sm:text-xl font-bold text-[var(--foreground)] mt-0.5 block">
            {goalStats.totalGoals}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] text-center shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
            In Progress
          </span>
          <span className="text-lg sm:text-xl font-bold text-[var(--primary)] mt-0.5 block">
            {goalStats.inProgressGoals}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] text-center shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
            Completed
          </span>
          <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {goalStats.completedGoals}
          </span>
        </div>
      </div>

      {/* Milestone Progress List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
          Active Milestone Progress
        </h4>

        {goalStats.goals.length > 0 ? (
          <div className="space-y-2.5">
            {goalStats.goals.slice(0, 4).map((goal) => (
              <div
                key={goal.id}
                className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {goal.section && (
                      <span
                        className="px-1.5 py-0.2 rounded text-[10px] font-semibold border shrink-0"
                        style={{
                          color: goal.section.color || "var(--primary)",
                          backgroundColor: `${goal.section.color || "#ea580c"}15`,
                          borderColor: `${goal.section.color || "#ea580c"}35`,
                        }}
                      >
                        {goal.section.name}
                      </span>
                    )}
                    <span className="font-bold text-[var(--foreground)] truncate">
                      {goal.title}
                    </span>
                  </div>

                  <span className="font-semibold text-[var(--primary)] text-[11px] shrink-0">
                    {goal.currentValue} / {goal.targetValue} {goal.unit} ({goal.progressPercentage}%)
                  </span>
                </div>

                <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      goal.status === "completed"
                        ? "bg-emerald-500"
                        : "bg-[var(--primary)]"
                    )}
                    style={{ width: `${goal.progressPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-[var(--muted-foreground)] bg-[var(--surface-sub)] rounded-xl border border-dashed border-[var(--border)]">
            No goals tracked yet.
          </div>
        )}
      </div>
    </Card>
  );
}
