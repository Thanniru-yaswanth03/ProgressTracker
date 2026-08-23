"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ActivityDTO } from "@/types";
import { deleteActivityAction } from "@/server/actions/activity.actions";
import { AlertTriangle } from "lucide-react";

export interface DeleteActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityDTO | null;
  onSuccess?: () => void;
}

export function DeleteActivityDialog({
  isOpen,
  onClose,
  activity,
  onSuccess,
}: DeleteActivityDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!activity) return null;

  const handleDelete = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await deleteActivityAction(activity.id);
      if (!res.success) {
        setError(res.error || "Failed to delete activity.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("DeleteActivityDialog error:", err);
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Activity Record" maxWidth="sm">
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            Are you sure you want to delete <span className="font-bold text-white">&ldquo;{activity.title}&rdquo;</span>? This will remove it permanently from your timeline history.
          </div>
        </div>

        {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
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
            Delete Activity
          </Button>
        </div>
      </div>
    </Modal>
  );
}
