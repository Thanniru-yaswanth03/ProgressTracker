"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TaskDTO, SectionDTO } from "@/types";
import { Card } from "@/components/ui/Card";
import { toggleTaskAction } from "@/server/actions/task.actions";
import { Check, CheckSquare, ChevronRight, Plus } from "lucide-react";
import { TaskModal } from "@/components/features/tasks/TaskModal";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TodayTasksWidgetProps {
  tasks: TaskDTO[];
  sections: SectionDTO[];
}

export function TodayTasksWidget({ tasks: initialTasks, sections }: TodayTasksWidgetProps) {
  const router = useRouter();
  const [tasks, setTasks] = React.useState<TaskDTO[]>(initialTasks);
  const [tab, setTab] = React.useState<"pending" | "completed">("pending");
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const currentList = tab === "pending" ? pendingTasks : completedTasks;

  const handleToggle = async (task: TaskDTO) => {
    if (togglingId) return;
    setTogglingId(task.id);

    const nextStatus = task.status === "completed" ? "pending" : "completed";
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              completedAt: nextStatus === "completed" ? new Date().toISOString() : null,
            }
          : t
      )
    );

    try {
      const res = await toggleTaskAction(task.id);
      if (!res.success) {
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
        );
      } else {
        router.refresh();
      }
    } catch {
      // Rollback
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Card className="p-5 border-slate-200 dark:border-slate-800/80 flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Today&apos;s Tasks
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {pendingTasks.length} pending &bull; {completedTasks.length} done
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
          <Link
            href="/tasks"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold flex items-center gap-0.5 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 self-start">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            tab === "pending"
              ? "bg-sky-500 text-white dark:text-slate-950 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Pending ({pendingTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("completed")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            tab === "completed"
              ? "bg-sky-500 text-white dark:text-slate-950 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Completed ({completedTasks.length})
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2 flex-1 min-h-[160px]">
        {currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-400 dark:text-slate-500">
            <CheckSquare className="w-8 h-8 opacity-30 mb-2" />
            <p className="text-xs">
              {tab === "pending"
                ? "No pending tasks planned for today! 🎯"
                : "No completed tasks yet for today."}
            </p>
          </div>
        ) : (
          currentList.slice(0, 5).map((task) => {
            const isCompleted = task.status === "completed";
            const isToggling = togglingId === task.id;

            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all",
                  isCompleted
                    ? "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60"
                    : "bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    disabled={isToggling}
                    className={cn(
                      "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer",
                      isCompleted
                        ? "bg-emerald-500 border-emerald-400 text-white dark:text-slate-950"
                        : "border-slate-300 dark:border-slate-700 hover:border-sky-400 bg-slate-50 dark:bg-slate-800/60"
                    )}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "text-xs font-semibold truncate",
                        isCompleted ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"
                      )}
                    >
                      {task.title}
                    </div>

                    {task.section && (
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: task.section.color || "#38bdf8" }}
                      >
                        {task.section.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Priority Pill */}
                {task.priority !== "medium" && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                      task.priority === "urgent" && "bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400",
                      task.priority === "high" && "bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400",
                      task.priority === "low" && "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {task.priority}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <TaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        sections={sections}
        onSuccess={() => router.refresh()}
      />
    </Card>
  );
}
