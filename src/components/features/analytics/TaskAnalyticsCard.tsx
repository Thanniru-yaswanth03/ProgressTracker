"use client";

import * as React from "react";
import { TaskStatsDTO } from "@/types";
import { CheckSquare } from "lucide-react";

interface TaskAnalyticsCardProps {
  taskStats: TaskStatsDTO;
}

const PRIORITY_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  urgent: { bar: "bg-rose-500", text: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  high: { bar: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  medium: { bar: "bg-sky-500", text: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  low: { bar: "bg-slate-400", text: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
};

export function TaskAnalyticsCard({ taskStats }: TaskAnalyticsCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Execution Metrics</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Task Completion Analysis
          </h2>
        </div>

        <div className="flex items-baseline gap-1 text-right">
          <span className="text-2xl font-extrabold text-sky-400">
            {taskStats.completionRate}%
          </span>
          <span className="text-xs text-slate-500">done</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Total Tasks
          </span>
          <span className="text-xl font-bold text-white mt-0.5 block">
            {taskStats.totalTasks}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Completed
          </span>
          <span className="text-xl font-bold text-sky-400 mt-0.5 block">
            {taskStats.completedTasks}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Pending
          </span>
          <span className="text-xl font-bold text-amber-400 mt-0.5 block">
            {taskStats.pendingTasks}
          </span>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Breakdown by Priority
        </h4>

        <div className="space-y-2.5">
          {taskStats.priorityBreakdown.map((pri) => {
            const colors = PRIORITY_COLORS[pri.priority] || PRIORITY_COLORS.medium;

            return (
              <div key={pri.priority} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 capitalize flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border ${colors.bg} ${colors.text}`}
                    >
                      {pri.priority}
                    </span>
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    <span className="text-white font-bold">{pri.completed}</span> /{" "}
                    {pri.total} ({pri.completionRate}%)
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                    style={{ width: `${pri.completionRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
