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

import { useToast } from "@/components/providers/ToastProvider";

export interface TodayTasksWidgetProps {
  tasks: TaskDTO[];
  sections: SectionDTO[];
}

export function TodayTasksWidget({ tasks: initialTasks, sections }: TodayTasksWidgetProps) {
  const router = useRouter();
  const toast = useToast();
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
        toast.error("Failed to update task", res.error || "Please try again.");
      } else {
        if (nextStatus === "completed") {
          toast.success("Task completed! 🎉", `"${task.title}" recorded to timeline.`);
        }
        router.refresh();
      }
    } catch {
      // Rollback
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
      toast.error("Failed to update task", "An unexpected error occurred.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Card className="p-5 flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">
              Today&apos;s Tasks
            </h3>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              {pendingTasks.length} pending &bull; {completedTasks.length} done
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
          <Link
            href="/tasks"
            className="text-xs text-[var(--primary)] hover:underline font-semibold flex items-center gap-0.5 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1 rounded-xl bg-[var(--surface-sub)] border border-[var(--border)] self-start">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            tab === "pending"
              ? "bg-[var(--surface)] text-[var(--primary)] shadow-xs font-bold border border-[var(--border)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Pending ({pendingTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("completed")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            tab === "completed"
              ? "bg-[var(--surface)] text-emerald-700 dark:text-emerald-400 shadow-xs font-bold border border-[var(--border)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Completed ({completedTasks.length})
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2 flex-1 min-h-[160px]">
        {currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center text-[var(--muted-foreground)]">
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
                    ? "bg-[var(--surface-sub)]/50 border-[var(--border-subtle)] opacity-60"
                    : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)] shadow-xs"
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
                        ? "bg-emerald-500 border-emerald-400 text-white font-bold animate-check-pop"
                        : "border-[var(--border-strong)] hover:border-[var(--primary)] bg-[var(--surface-sub)]"
                    )}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "text-xs font-semibold truncate",
                        isCompleted
                          ? "line-through text-[var(--muted-foreground)]"
                          : "text-[var(--foreground)]"
                      )}
                    >
                      {task.title}
                    </div>

                    {task.section && (
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: task.section.color || "var(--primary)" }}
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
                      task.priority === "urgent" && "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
                      task.priority === "high" && "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20",
                      task.priority === "low" && "bg-[var(--surface-sub)] text-[var(--muted-foreground)] border border-[var(--border)]"
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
