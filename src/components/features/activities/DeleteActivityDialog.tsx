"use client";

import * as React from "react";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { ActivityDTO } from "@/types";
import { deleteActivityAction } from "@/server/actions/activity.actions";
import { useToast } from "@/components/providers/ToastProvider";

export interface DeleteActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityDTO | null;
  onSuccess?: (deletedActivityId: string) => void;
}

export function DeleteActivityDialog({
  isOpen,
  onClose,
  activity,
  onSuccess,
}: DeleteActivityDialogProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  if (!activity) return null;

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const res = await deleteActivityAction(activity.id);
      if (!res.success) {
        toast.error("Failed to delete activity", res.error || "Please try again.");
        setIsLoading(false);
        return;
      }

      toast.success("Activity deleted", `"${activity.title}" was removed from timeline.`);
      setIsLoading(false);
      onClose();
      if (onSuccess) onSuccess(activity.id);
    } catch (err) {
      console.error("DeleteActivityDialog error:", err);
      toast.error("Failed to delete activity", "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Activity Record"
      itemName={activity.title}
      itemType="Activity"
      warningText="This will remove this record permanently from your timeline and history calculations."
      confirmButtonText="Delete Activity"
      isLoading={isLoading}
    />
  );
}
