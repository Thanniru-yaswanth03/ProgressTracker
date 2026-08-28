"use client";

import * as React from "react";
import { TaskStatsDTO } from "@/types";
import { CheckSquare } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface TaskAnalyticsCardProps {
  taskStats: TaskStatsDTO;
}

const PRIORITY_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  urgent: { bar: "bg-rose-500", text: "text-rose-700 dark:text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  high: { bar: "bg-orange-500", text: "text-orange-700 dark:text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  medium: { bar: "bg-sky-500", text: "text-sky-700 dark:text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  low: { bar: "bg-[var(--muted-foreground)]", text: "text-[var(--muted-foreground)]", bg: "bg-[var(--surface-sub)] border-[var(--border)]" },
};

export function TaskAnalyticsCard({ taskStats }: TaskAnalyticsCardProps) {
  return (
    <Card className="p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Execution Metrics</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight">
            Task Completion Analysis
          </h2>
        </div>

        <div className="flex items-baseline gap-1 text-right">
          <span className="text-xl sm:text-2xl font-extrabold text-sky-600 dark:text-sky-400">
            {taskStats.completionRate}%
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">done</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] text-center shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
            Total Tasks
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-[var(--foreground)] mt-0.5 block">
            {taskStats.totalTasks}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] text-center shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
            Completed
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-sky-600 dark:text-sky-400 mt-0.5 block">
            {taskStats.completedTasks}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] text-center shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
            Pending
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
            {taskStats.pendingTasks}
          </span>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
          Breakdown by Priority
        </h4>

        <div className="space-y-2.5">
          {taskStats.priorityBreakdown.map((pri) => {
            const colors = PRIORITY_COLORS[pri.priority] || PRIORITY_COLORS.medium;

            return (
              <div key={pri.priority} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--foreground)] capitalize flex items-center gap-1.5">
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border",
                        colors.bg,
                        colors.text
                      )}
                    >
                      {pri.priority}
                    </span>
                  </span>
                  <span className="text-[var(--muted-foreground)] text-[11px]">
                    <span className="text-[var(--foreground)] font-bold">{pri.completed}</span> /{" "}
                    {pri.total} ({pri.completionRate}%)
                  </span>
                </div>

                <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", colors.bar)}
                    style={{ width: `${pri.completionRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
