"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { HabitDTO } from "@/types";
import { deleteHabitAction } from "@/server/actions/habit.actions";
import { AlertTriangle } from "lucide-react";

export interface DeleteHabitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  habit: HabitDTO | null;
  onSuccess?: () => void;
}

export function DeleteHabitDialog({
  isOpen,
  onClose,
  habit,
  onSuccess,
}: DeleteHabitDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!habit) return null;

  const handleDelete = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await deleteHabitAction(habit.id);
      if (!res.success) {
        setError(res.error || "Failed to delete habit.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("DeleteHabitDialog error:", err);
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Habit Routine" maxWidth="sm">
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            Are you sure you want to delete <span className="font-bold text-[var(--foreground)]">&ldquo;{habit.title}&rdquo;</span>? This will also remove all logged check-in history and streak records for this habit.
          </div>
        </div>

        {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isLoading}
          >
            Delete Habit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
