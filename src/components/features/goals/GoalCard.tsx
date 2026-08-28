"use client";

import * as React from "react";
import { GoalDTO } from "@/types";
import {
  Calendar,
  CheckCircle2,
  Edit2,
  Flame,
  MoreVertical,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import {
  updateGoalProgressAction,
  toggleGoalPauseAction,
  completeGoalAction,
  deleteGoalAction,
} from "@/server/actions/goal.actions";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: GoalDTO;
  onEdit: (goal: GoalDTO) => void;
  onQuickProgress: (goal: GoalDTO) => void;
}

export function GoalCard({ goal, onEdit, onQuickProgress }: GoalCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [showMenu, setShowMenu] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const isCompleted = goal.status === "completed";
  const isPaused = goal.status === "paused";

  const handleIncrement = (amount: number) => {
    const nextVal = Math.min(goal.targetValue, goal.currentValue + amount);
    if (nextVal === goal.currentValue) return;

    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateGoalProgressAction(goal.id, nextVal);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to update progress");
      } else {
        router.refresh();
      }
    });
  };

  const handleTogglePause = () => {
    setShowMenu(false);
    setErrorMsg(null);
    startTransition(async () => {
      const res = await toggleGoalPauseAction(goal.id);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to toggle pause state");
      } else {
        router.refresh();
      }
    });
  };

  const handleComplete = () => {
    setShowMenu(false);
    setErrorMsg(null);
    startTransition(async () => {
      const res = await completeGoalAction(goal.id);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to complete goal");
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (!confirm(`Are you sure you want to delete goal "${goal.title}"?`)) return;

    startTransition(async () => {
      const res = await deleteGoalAction(goal.id);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to delete goal");
      } else {
        router.refresh();
      }
    });
  };

  // Status pill color
  let statusBadge = (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft-border)]">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
      In Progress
    </span>
  );

  if (isCompleted) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" />
        Completed
      </span>
    );
  } else if (isPaused) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
        <Pause className="w-3 h-3" />
        Paused
      </span>
    );
  }

  // Days remaining pill
  let deadlineBadge = null;
  if (goal.targetDate && goal.daysRemaining !== null && goal.daysRemaining !== undefined) {
    let text = `${goal.daysRemaining} days left`;
    let colorClass = "text-[var(--muted-foreground)] bg-[var(--surface-sub)] border-[var(--border)]";

    if (goal.daysRemaining < 0) {
      text = `${Math.abs(goal.daysRemaining)}d Overdue`;
      colorClass = "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
    } else if (goal.daysRemaining === 0) {
      text = "Due Today";
      colorClass = "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
    } else if (goal.daysRemaining <= 3) {
      colorClass = "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20";
    }

    deadlineBadge = (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${colorClass}`}
      >
        <Calendar className="w-3 h-3" />
        <span>{text}</span>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-between p-5 transition-all duration-200",
        isCompleted && "border-emerald-500/30",
        isPaused && "border-amber-500/30 opacity-85"
      )}
    >
      {/* Top Bar: Section & Actions */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center flex-wrap gap-1.5">
            {goal.section && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border"
                style={{
                  color: goal.section.color || "var(--primary)",
                  backgroundColor: `${goal.section.color || "#ea580c"}15`,
                  borderColor: `${goal.section.color || "#ea580c"}35`,
                }}
              >
                {goal.section.name}
              </span>
            )}
            {statusBadge}
          </div>

          {/* Context Menu */}
          <div className="relative">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              aria-label="Goal Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-xl p-1 z-30 flex flex-col gap-0.5 animate-enter-fade">
                  {!isCompleted && (
                    <>
                      <button
                        type="button"
                        onClick={handleTogglePause}
                        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-left cursor-pointer"
                      >
                        {isPaused ? (
                          <>
                            <Play className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Resume Goal</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5 text-amber-500" />
                            <span>Pause Goal</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleComplete}
                        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Mark Completed</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(goal);
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Goal</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] tracking-tight mb-1 group-hover:text-[var(--primary)] transition-colors">
          {goal.title}
        </h3>
        {goal.description ? (
          <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mb-4 leading-relaxed">
            {goal.description}
          </p>
        ) : (
          <div className="h-2" />
        )}
      </div>

      {/* Center: Progress Metric Display */}
      <div className="my-2 bg-[var(--surface-sub)] rounded-xl p-3.5 border border-[var(--border-subtle)] shadow-xs">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
              {goal.currentValue}
            </span>
            <span className="text-xs text-[var(--muted-foreground)] font-medium">
              / {goal.targetValue} {goal.unit}
            </span>
          </div>

          <div className="flex items-center gap-1 font-extrabold text-xs sm:text-sm text-[var(--primary)]">
            <span>{goal.progressPercentage}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isCompleted
                ? "bg-emerald-500"
                : isPaused
                ? "bg-amber-500"
                : "bg-[var(--primary)]"
            )}
            style={{ width: `${goal.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Bottom Row: Deadline & Quick Actions */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <div>{deadlineBadge}</div>

        {!isCompleted && !isPaused && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isPending || goal.currentValue >= goal.targetValue}
              onClick={() => handleIncrement(1)}
              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold bg-[var(--surface-sub)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              title="Add +1"
            >
              <Plus className="w-3 h-3" />
              <span>1</span>
            </button>

            {goal.targetValue >= 10 && (
              <button
                type="button"
                disabled={isPending || goal.currentValue >= goal.targetValue}
                onClick={() => handleIncrement(5)}
                className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold bg-[var(--surface-sub)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                title="Add +5"
              >
                <Plus className="w-3 h-3" />
                <span>5</span>
              </button>
            )}

            <button
              type="button"
              disabled={isPending}
              onClick={() => onQuickProgress(goal)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-xs transition-colors cursor-pointer"
            >
              <span>Update</span>
            </button>
          </div>
        )}

        {isCompleted && (
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-emerald-500" />
            Goal Complete! 🎉
          </span>
        )}

        {isPaused && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleTogglePause}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3" />
            <span>Resume</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
          {errorMsg}
        </div>
      )}
    </Card>
  );
}
