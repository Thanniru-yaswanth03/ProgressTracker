"use client";

import * as React from "react";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { GoalDTO } from "@/types";
import { deleteGoalAction } from "@/server/actions/goal.actions";
import { useToast } from "@/components/providers/ToastProvider";

export interface DeleteGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goal: GoalDTO | null;
  onSuccess?: (deletedGoalId: string) => void;
}

export function DeleteGoalDialog({
  isOpen,
  onClose,
  goal,
  onSuccess,
}: DeleteGoalDialogProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  if (!goal) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await deleteGoalAction(goal.id);
      if (!res.success) {
        toast.error("Failed to delete goal", res.error || "Please try again.");
        setIsLoading(false);
        return;
      }

      toast.success("Goal deleted", `"${goal.title}" was removed.`);
      setIsLoading(false);
      onClose();
      if (onSuccess) onSuccess(goal.id);
    } catch (err) {
      console.error("DeleteGoalDialog error:", err);
      toast.error("Failed to delete goal", "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Milestone Goal"
      itemName={goal.title}
      itemType="Goal"
      warningText="This will permanently delete this milestone and its progress history."
      confirmButtonText="Delete Goal"
      isLoading={isLoading}
    />
  );
}
