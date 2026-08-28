"use client";

import * as React from "react";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { SectionDTO } from "@/types";
import { deleteSectionAction } from "@/server/actions/section.actions";
import { useToast } from "@/components/providers/ToastProvider";

export interface DeleteSectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: SectionDTO | null;
  onSuccess?: (deletedSectionId: string) => void;
}

export function DeleteSectionDialog({
  isOpen,
  onClose,
  section,
  onSuccess,
}: DeleteSectionDialogProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  if (!section) return null;

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const res = await deleteSectionAction(section.id);
      if (!res.success) {
        toast.error("Failed to delete section", res.error || "Please try again.");
        setIsLoading(false);
        return;
      }

      toast.success("Section deleted", `"${section.name}" was removed. Tasks and habits moved to General.`);
      setIsLoading(false);
      onClose();
      if (onSuccess) onSuccess(section.id);
    } catch (err) {
      console.error("DeleteSectionDialog error:", err);
      toast.error("Failed to delete section", "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Section Domain"
      itemName={section.name}
      itemType="Section"
      warningText="Associated tasks, habits, and activities will be safely moved to General."
      confirmButtonText="Delete Section"
      isLoading={isLoading}
    />
  );
}
