"use client";

import * as React from "react";
import { GoalDTO } from "@/types";
import { updateGoalProgressAction } from "@/server/actions/goal.actions";
import { Check, Loader2, Minus, Plus, Target, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickProgressModalProps {
  goal: GoalDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickProgressModal({
  goal,
  isOpen,
  onClose,
}: QuickProgressModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [val, setVal] = React.useState<number>(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (goal) {
      setVal(goal.currentValue);
      setErrorMsg(null);
    }
  }, [goal, isOpen]);

  if (!isOpen || !goal) return null;

  const target = goal.targetValue;
  const newPercent = target > 0 ? Math.min(100, Math.max(0, Math.round((val / target) * 100))) : 0;

  const handleAdjust = (delta: number) => {
    const next = Math.max(0, Math.min(target, val + delta));
    setVal(next);
  };

  const handleSave = () => {
    if (val < 0) {
      setErrorMsg("Progress cannot be negative");
      return;
    }

    if (val > target) {
      setErrorMsg("Progress cannot exceed target value");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateGoalProgressAction(goal.id, val);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to update progress");
      } else {
        router.refresh();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Update Progress
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">
                {goal.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Value Stepper & Input */}
        <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800/80 mb-5 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
            Current Count ({goal.unit})
          </span>

          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => handleAdjust(-1)}
              disabled={val <= 0}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 transition-colors disabled:opacity-30"
              aria-label="Decrease by 1"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="number"
              min={0}
              max={target}
              step="any"
              value={val}
              onChange={(e) => setVal(Number(e.target.value))}
              className="w-28 text-center text-3xl font-extrabold text-white bg-transparent border-b-2 border-indigo-500 focus:outline-none focus:border-indigo-400 transition-colors"
            />

            <button
              type="button"
              onClick={() => handleAdjust(1)}
              disabled={val >= target}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 transition-colors disabled:opacity-30"
              aria-label="Increase by 1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Increment Chips */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {[1, 5, 10, 25].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleAdjust(amt)}
                disabled={val + amt > target}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 transition-colors disabled:opacity-30"
              >
                +{amt}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setVal(target)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 hover:bg-indigo-900/60 transition-colors"
            >
              Max
            </button>
          </div>

          {/* Progress Bar Preview */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${newPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>Progress: {newPercent}%</span>
            <span>Target: {target} {goal.unit}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Confirm Progress</span>
          </button>
        </div>
      </div>
    </div>
  );
}
