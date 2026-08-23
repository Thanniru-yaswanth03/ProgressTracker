"use client";

import * as React from "react";
import { TaskDTO } from "@/types";
import { Card } from "@/components/ui/Card";
import { AlertCircle, CheckCircle2, Clock, ListTodo } from "lucide-react";

export interface TaskStatsHeaderProps {
  tasks: TaskDTO[];
}

export function TaskStatsHeader({ tasks }: TaskStatsHeaderProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = total - completed;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = tasks.filter((t) => {
    if (t.status === "completed" || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  }).length;

  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Tasks */}
      <Card className="p-4 flex items-center gap-3.5 border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <ListTodo className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Tasks
          </div>
          <div className="text-xl font-extrabold text-white mt-0.5">{total}</div>
        </div>
      </Card>

      {/* Pending Tasks */}
      <Card className="p-4 flex items-center gap-3.5 border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Pending
          </div>
          <div className="text-xl font-extrabold text-white mt-0.5">{pending}</div>
        </div>
      </Card>

      {/* Completed Tasks */}
      <Card className="p-4 flex items-center gap-3.5 border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Completed
            </span>
            <span className="text-[10px] font-bold text-emerald-400">
              {completionPercentage}%
            </span>
          </div>
          <div className="text-xl font-extrabold text-white mt-0.5">{completed}</div>
        </div>
      </Card>

      {/* Overdue Tasks */}
      <Card className="p-4 flex items-center gap-3.5 border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-red-500/20 flex items-center justify-center text-rose-400 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Overdue
          </div>
          <div className="text-xl font-extrabold text-rose-400 mt-0.5">{overdue}</div>
        </div>
      </Card>
    </div>
  );
}
