"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  itemName?: string;
  itemType?: string;
  description?: string;
  warningText?: string;
  confirmButtonText?: string;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = "item",
  description,
  warningText,
  confirmButtonText,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setInternalLoading(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setError(null);
    setInternalLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error("DeleteConfirmDialog error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete. Please try again.");
      setInternalLoading(false);
    }
  };

  const loadingState = isLoading || internalLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loadingState) onClose();
      }}
      title={title}
      description={description}
      maxWidth="sm"
    >
      <div className="space-y-4 pt-1 text-left">
        {/* Destructive Warning Box */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p>
              Are you sure you want to delete{" "}
              {itemName ? (
                <span className="font-bold text-[var(--foreground)]">
                  &ldquo;{itemName}&rdquo;
                </span>
              ) : (
                `this ${itemType}`
              )}
              ?
            </p>
            {warningText && (
              <p className="text-[11px] opacity-90 text-rose-800 dark:text-rose-300">
                {warningText}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loadingState}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            isLoading={loadingState}
            className="min-w-[110px]"
          >
            {confirmButtonText || `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
