"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SectionDTO } from "@/types";
import { deleteSectionAction } from "@/server/actions/section.actions";
import { AlertTriangle } from "lucide-react";

export interface DeleteSectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: SectionDTO | null;
  onSuccess?: () => void;
}

export function DeleteSectionDialog({
  isOpen,
  onClose,
  section,
  onSuccess,
}: DeleteSectionDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!section) return null;

  const handleDelete = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await deleteSectionAction(section.id);
      if (!res.success) {
        setError(res.error || "Failed to delete section.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("DeleteSectionDialog error:", err);
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Section"
      maxWidth="sm"
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            Are you sure you want to delete <span className="font-bold text-[var(--foreground)]">&ldquo;{section.name}&rdquo;</span>? Associated tasks and habits will be moved to General.
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}

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
            Delete Section
          </Button>
        </div>
      </div>
    </Modal>
  );
}
