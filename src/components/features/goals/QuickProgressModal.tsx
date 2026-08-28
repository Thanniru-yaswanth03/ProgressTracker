"use client";

import * as React from "react";
import { GoalDTO } from "@/types";
import { updateGoalProgressAction } from "@/server/actions/goal.actions";
import { Check, Minus, Plus, Target, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-enter-fade">
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-2xl p-6 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] flex items-center justify-center text-[var(--primary)]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">
                Update Progress
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] truncate max-w-[240px]">
                {goal.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Value Stepper & Input */}
        <div className="bg-[var(--surface-sub)] rounded-2xl p-5 border border-[var(--border-subtle)] mb-5 text-center">
          <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-3">
            Current Count ({goal.unit})
          </span>

          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => handleAdjust(-1)}
              disabled={val <= 0}
              className="w-10 h-10 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] flex items-center justify-center border border-[var(--border)] transition-colors disabled:opacity-30 cursor-pointer shadow-xs"
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
              className="w-28 text-center text-3xl font-extrabold text-[var(--foreground)] bg-transparent border-b-2 border-[var(--primary)] focus:outline-none transition-colors"
            />

            <button
              type="button"
              onClick={() => handleAdjust(1)}
              disabled={val >= target}
              className="w-10 h-10 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] flex items-center justify-center border border-[var(--border)] transition-colors disabled:opacity-30 cursor-pointer shadow-xs"
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
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] border border-[var(--border)] transition-colors disabled:opacity-30 cursor-pointer shadow-xs"
              >
                +{amt}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setVal(target)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft-border)] hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer"
            >
              Max
            </button>
          </div>

          {/* Progress Bar Preview */}
          <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
              style={{ width: `${newPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mt-2">
            <span>Progress: {newPercent}%</span>
            <span>Target: {target} {goal.unit}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            isLoading={isPending}
            className="gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm Progress</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
