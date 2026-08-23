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
  Target,
  Trash2,
} from "lucide-react";
import {
  updateGoalProgressAction,
  toggleGoalPauseAction,
  completeGoalAction,
  deleteGoalAction,
} from "@/server/actions/goal.actions";
import { useRouter } from "next/navigation";

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
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
      In Progress
    </span>
  );

  if (isCompleted) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        Completed
      </span>
    );
  } else if (isPaused) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Pause className="w-3 h-3 text-amber-400" />
        Paused
      </span>
    );
  }

  // Deadline calculation
  let deadlineBadge = null;
  if (goal.targetDate && goal.daysRemaining !== undefined && goal.daysRemaining !== null) {
    let text = `${goal.daysRemaining} days left`;
    let colorClass = "text-slate-400 bg-slate-800/60 border-slate-700/60";

    if (isCompleted) {
      text = "Target Achieved";
      colorClass = "text-emerald-400/80 bg-emerald-950/30 border-emerald-800/30";
    } else if (goal.daysRemaining < 0) {
      text = `Overdue by ${Math.abs(goal.daysRemaining)}d`;
      colorClass = "text-rose-400 bg-rose-950/30 border-rose-800/40";
    } else if (goal.daysRemaining === 0) {
      text = "Due Today";
      colorClass = "text-amber-400 bg-amber-950/40 border-amber-800/50";
    } else if (goal.daysRemaining <= 3) {
      colorClass = "text-amber-300 bg-amber-950/30 border-amber-800/40";
    }

    deadlineBadge = (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${colorClass}`}
      >
        <Calendar className="w-3 h-3" />
        <span>{text}</span>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border bg-slate-900/70 backdrop-blur-sm p-5 transition-all duration-200 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/5 ${
        isCompleted
          ? "border-emerald-500/20 bg-gradient-to-b from-slate-900/90 to-emerald-950/10"
          : isPaused
          ? "border-amber-500/20 opacity-85"
          : "border-slate-800"
      }`}
    >
      {/* Top Bar: Section & Actions */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center flex-wrap gap-1.5">
            {goal.section && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                style={{
                  color: goal.section.color,
                  backgroundColor: `${goal.section.color}15`,
                  borderColor: `${goal.section.color}35`,
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
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-slate-850 border border-slate-700 shadow-2xl p-1 z-30 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {!isCompleted && (
                    <>
                      <button
                        type="button"
                        onClick={handleTogglePause}
                        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-slate-200 hover:text-white hover:bg-slate-750 rounded-lg transition-colors text-left"
                      >
                        {isPaused ? (
                          <>
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Resume Goal</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5 text-amber-400" />
                            <span>Pause Goal</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleComplete}
                        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-slate-200 hover:text-white hover:bg-slate-750 rounded-lg transition-colors text-left"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-slate-200 hover:text-white hover:bg-slate-750 rounded-lg transition-colors text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors text-left"
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
        <h3 className="text-base font-semibold text-white tracking-tight mb-1 group-hover:text-indigo-200 transition-colors">
          {goal.title}
        </h3>
        {goal.description ? (
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {goal.description}
          </p>
        ) : (
          <div className="h-2" />
        )}
      </div>

      {/* Center: Progress Metric Display */}
      <div className="my-2 bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white tracking-tight">
              {goal.currentValue}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {goal.targetValue} {goal.unit}
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold text-sm text-indigo-400">
            <span>{goal.progressPercentage}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : isPaused
                ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                : "bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400"
            }`}
            style={{ width: `${goal.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Bottom Row: Deadline & Quick Actions */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
        <div>{deadlineBadge}</div>

        {!isCompleted && !isPaused && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isPending || goal.currentValue >= goal.targetValue}
              onClick={() => handleIncrement(1)}
              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors disabled:opacity-50"
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
                className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors disabled:opacity-50"
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/80 text-white hover:bg-indigo-600 shadow-sm transition-colors"
            >
              <span>Update</span>
            </button>
          </div>
        )}

        {isCompleted && (
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            Goal Complete!
          </span>
        )}

        {isPaused && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleTogglePause}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-colors"
          >
            <Play className="w-3 h-3" />
            <span>Resume</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-800/40">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
