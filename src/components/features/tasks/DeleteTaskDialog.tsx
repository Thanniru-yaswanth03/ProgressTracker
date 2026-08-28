"use client";

import * as React from "react";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { TaskDTO } from "@/types";
import { deleteTaskAction } from "@/server/actions/task.actions";
import { useToast } from "@/components/providers/ToastProvider";

export interface DeleteTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskDTO | null;
  onSuccess?: (deletedTaskId: string) => void;
}

export function DeleteTaskDialog({
  isOpen,
  onClose,
  task,
  onSuccess,
}: DeleteTaskDialogProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  if (!task) return null;

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const res = await deleteTaskAction(task.id);
      if (!res.success) {
        toast.error("Failed to delete task", res.error || "Please try again.");
        setIsLoading(false);
        return;
      }

      toast.success("Task deleted", `"${task.title}" has been removed.`);
      setIsLoading(false);
      onClose();
      if (onSuccess) onSuccess(task.id);
    } catch (err) {
      console.error("DeleteTaskDialog error:", err);
      toast.error("Failed to delete task", "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Task"
      itemName={task.title}
      itemType="Task"
      warningText="This will remove this task and its completed activity logs."
      confirmButtonText="Delete Task"
      isLoading={isLoading}
    />
  );
}
