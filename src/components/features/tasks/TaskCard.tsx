"use client";

import * as React from "react";
import { TaskDTO } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toggleTaskAction } from "@/server/actions/task.actions";
import {
  Calendar,
  Check,
  Clock,
  Edit2,
  Flag,
  Folder,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskCardProps {
  task: TaskDTO;
  onEdit: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onToggleSuccess?: (updatedTask: TaskDTO) => void;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleSuccess,
}: TaskCardProps) {
  const [isCompleted, setIsCompleted] = React.useState(task.status === "completed");
  const [isToggling, setIsToggling] = React.useState(false);

  React.useEffect(() => {
    setIsCompleted(task.status === "completed");
  }, [task.status]);

  const handleToggle = async () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState); // Optimistic UI
    setIsToggling(true);

    try {
      const res = await toggleTaskAction(
        task.id,
        nextState ? "completed" : "pending"
      );
      if (!res.success) {
        setIsCompleted(!nextState); // Rollback on failure
      } else if (res.data && onToggleSuccess) {
        onToggleSuccess(res.data);
      }
    } catch {
      setIsCompleted(!nextState);
    } finally {
      setIsToggling(false);
    }
  };

  // Due date calculations
  const getDueDateInfo = () => {
    if (!task.dueDate) return null;
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDay = new Date(due);
    dueDay.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = due.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    if (isCompleted) {
      return { text: `Due ${formatted}`, variant: "neutral" as const, isOverdue: false };
    }

    if (diffDays < 0) {
      return {
        text: `Overdue (${formatted})`,
        variant: "danger" as const,
        isOverdue: true,
      };
    } else if (diffDays === 0) {
      return { text: "Due today", variant: "warning" as const, isOverdue: false };
    } else if (diffDays === 1) {
      return { text: "Due tomorrow", variant: "primary" as const, isOverdue: false };
    }
    return { text: `Due ${formatted}`, variant: "neutral" as const, isOverdue: false };
  };

  const dueInfo = getDueDateInfo();

  const priorityVariants = {
    low: { label: "Low", className: "bg-slate-800/80 text-slate-400 border-slate-700/50" },
    medium: { label: "Medium", className: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
    high: { label: "High", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    urgent: { label: "Urgent", className: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  };

  return (
    <Card
      className={cn(
        "group flex flex-col justify-between p-4 transition-all duration-200 border-slate-800/80 hover:border-slate-700/80 relative overflow-hidden",
        isCompleted && "opacity-65 bg-slate-950/40"
      )}
    >
      <div className="flex items-start gap-3.5">
        {/* Custom Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isToggling}
          aria-label={isCompleted ? "Mark task as pending" : "Mark task as completed"}
          className={cn(
            "w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer mt-0.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500",
            isCompleted
              ? "bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/30"
              : "border-slate-600 hover:border-indigo-400 bg-slate-900/60"
          )}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "font-semibold text-sm text-slate-100 transition-all leading-tight",
                isCompleted && "line-through text-slate-400 font-normal"
              )}
            >
              {task.title}
            </h4>

            {/* Quick Actions */}
            <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit task"
                aria-label={`Edit ${task.title}`}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Delete task"
                aria-label={`Delete ${task.title}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Tags & Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-800/60">
            {/* Section Tag */}
            {task.section ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                style={{
                  color: task.section.color || "#6366f1",
                  backgroundColor: `${task.section.color || "#6366f1"}15`,
                  borderColor: `${task.section.color || "#6366f1"}30`,
                }}
              >
                <Folder className="w-2.5 h-2.5" />
                <span className="truncate max-w-[110px]">{task.section.name}</span>
              </span>
            ) : null}

            {/* Priority Badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                priorityVariants[task.priority]?.className
              )}
            >
              <Flag className="w-2.5 h-2.5" />
              <span>{priorityVariants[task.priority]?.label || "Medium"}</span>
            </span>

            {/* Due Date Badge */}
            {dueInfo && (
              <Badge variant={dueInfo.variant} className="text-[10px] gap-1">
                {dueInfo.isOverdue ? (
                  <Clock className="w-2.5 h-2.5 text-rose-400" />
                ) : (
                  <Calendar className="w-2.5 h-2.5" />
                )}
                <span>{dueInfo.text}</span>
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
