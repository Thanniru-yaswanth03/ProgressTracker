"use client";

import * as React from "react";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { HabitDTO } from "@/types";
import { deleteHabitAction } from "@/server/actions/habit.actions";
import { useToast } from "@/components/providers/ToastProvider";

export interface DeleteHabitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  habit: HabitDTO | null;
  onSuccess?: (deletedHabitId: string) => void;
}

export function DeleteHabitDialog({
  isOpen,
  onClose,
  habit,
  onSuccess,
}: DeleteHabitDialogProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  if (!habit) return null;

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const res = await deleteHabitAction(habit.id);
      if (!res.success) {
        toast.error("Failed to delete habit", res.error || "Please try again.");
        setIsLoading(false);
        return;
      }

      toast.success("Habit deleted", `"${habit.title}" has been removed.`);
      setIsLoading(false);
      onClose();
      if (onSuccess) onSuccess(habit.id);
    } catch (err) {
      console.error("DeleteHabitDialog error:", err);
      toast.error("Failed to delete habit", "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Habit Routine"
      itemName={habit.title}
      itemType="Habit"
      warningText="This will remove this habit, its check-in records, and streak history."
      confirmButtonText="Delete Habit"
      isLoading={isLoading}
    />
  );
}
