"use client";

import * as React from "react";
import { GoalDTO } from "@/types";
import { updateGoalAction } from "@/server/actions/goal.actions";
import { Minus, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/providers/ToastProvider";

interface QuickProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: GoalDTO | null;
  onSuccess?: (updatedGoal: GoalDTO) => void;
}

export function QuickProgressModal({
  isOpen,
  onClose,
  goal,
  onSuccess,
}: QuickProgressModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = React.useTransition();

  const [currentValue, setCurrentValue] = React.useState<number>(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (goal && isOpen) {
      setCurrentValue(goal.currentValue);
      setErrorMsg(null);
    }
  }, [goal, isOpen]);

  if (!goal) return null;

  const targetValue = goal.targetValue;
  const unit = goal.unit || "";

  const handleQuickAdd = (delta: number) => {
    setCurrentValue((prev) => {
      const next = Math.max(0, Math.min(targetValue, Number((prev + delta).toFixed(2))));
      return next;
    });
  };

  const handleSave = () => {
    setErrorMsg(null);

    if (currentValue < 0) {
      setErrorMsg("Progress cannot be negative");
      return;
    }

    if (currentValue > targetValue) {
      setErrorMsg(`Progress cannot exceed target of ${targetValue} ${unit}`);
      return;
    }

    startTransition(async () => {
      const willComplete = currentValue >= targetValue;
      const res = await updateGoalAction(goal.id, {
        currentValue,
        status: willComplete ? "completed" : goal.status === "completed" ? "in_progress" : goal.status,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to update progress");
        toast.error("Failed to update progress", res.error || "Please try again.");
      } else {
        if (willComplete) {
          toast.success("Goal completed! 🎉", `"${goal.title}" milestone reached 100%!`);
        } else {
          toast.success("Progress saved", `Updated to ${currentValue}/${targetValue} ${unit}`);
        }
        router.refresh();
        onClose();
        if (onSuccess && res.data) onSuccess(res.data);
      }
    });
  };

  const progressPercent =
    targetValue > 0 ? Math.min(100, Math.max(0, Math.round((currentValue / targetValue) * 100))) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Goal Progress"
      description={`Log incremental progress towards "${goal.title}"`}
      maxWidth="sm"
    >
      <div className="space-y-4 pt-1 text-left">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Progress Bar & Value Banner */}
        <div className="p-4 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted-foreground)] font-medium">Current Completion</span>
            <span className="font-extrabold text-[var(--primary)] text-sm">{progressPercent}%</span>
          </div>

          <div className="w-full h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)]">
            <span>0</span>
            <span className="font-semibold text-[var(--foreground)]">
              Target: {targetValue} {unit}
            </span>
          </div>
        </div>

        {/* Counter Stepper Control */}
        <div className="flex items-center justify-center gap-3 py-2">
          <button
            type="button"
            onClick={() => handleQuickAdd(-1)}
            disabled={isPending || currentValue <= 0}
            className="w-10 h-10 rounded-xl bg-[var(--surface-sub)] border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="Decrease by 1"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="relative flex-1 max-w-[140px]">
            <input
              type="number"
              min={0}
              max={targetValue}
              step="any"
              value={currentValue}
              onChange={(e) => setCurrentValue(Number(e.target.value))}
              className="w-full text-center py-2 px-2 text-lg font-bold rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
              disabled={isPending}
            />
          </div>

          <button
            type="button"
            onClick={() => handleQuickAdd(1)}
            disabled={isPending || currentValue >= targetValue}
            className="w-10 h-10 rounded-xl bg-[var(--surface-sub)] border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="Increase by 1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Increment Pill Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-[10px] text-[var(--muted-foreground)] mr-1">Quick Add:</span>
          {[1, 5, 10, 25].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleQuickAdd(amt)}
              disabled={isPending || currentValue >= targetValue}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--surface-sub)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors cursor-pointer"
            >
              +{amt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentValue(targetValue)}
            disabled={isPending || currentValue >= targetValue}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Complete</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
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
          >
            Save Progress
          </Button>
        </div>
      </div>
    </Modal>
  );
}
