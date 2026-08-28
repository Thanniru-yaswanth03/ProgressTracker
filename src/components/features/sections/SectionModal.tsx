"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SectionDTO } from "@/types";
import { createSectionAction, updateSectionAction } from "@/server/actions/section.actions";
import { Check, FolderPlus, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export const PRESET_COLORS = [
  { name: "Orange", hex: "#ea580c" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Amber", hex: "#d97706" },
  { name: "Emerald", hex: "#059669" },
  { name: "Sky", hex: "#0284c7" },
  { name: "Rose", hex: "#e11d48" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Cyan", hex: "#0891b2" },
  { name: "Pink", hex: "#db2777" },
  { name: "Charcoal", hex: "#4b5563" },
];

import { useToast } from "@/components/providers/ToastProvider";

export interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section?: SectionDTO | null; // If provided, edit mode; else create mode
  onSuccess?: (savedSection: SectionDTO) => void;
}

export function SectionModal({
  isOpen,
  onClose,
  section,
  onSuccess,
}: SectionModalProps) {
  const toast = useToast();
  const isEditing = !!section;

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState("#ea580c");
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  // Sync state when section prop changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (section) {
        setName(section.name);
        setDescription(section.description || "");
        setColor(section.color || "#ea580c");
      } else {
        setName("");
        setDescription("");
        setColor("#ea580c");
      }
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      if (isEditing && section) {
        const res = await updateSectionAction(section.id, {
          name: name.trim(),
          description: description.trim(),
          color,
        });

        if (!res.success) {
          setIsLoading(false);
          if (res.errors) setFieldErrors(res.errors);
          if (res.error) setError(res.error);
          toast.error("Failed to update section", res.error || "Please check inputs.");
          return;
        }

        toast.success("Section updated", `"${name.trim()}" saved.`);
        if (res.data && onSuccess) {
          onSuccess(res.data);
        }
      } else {
        const res = await createSectionAction({
          name: name.trim(),
          description: description.trim(),
          color,
        });

        if (!res.success) {
          setIsLoading(false);
          if (res.errors) setFieldErrors(res.errors);
          if (res.error) setError(res.error);
          toast.error("Failed to create section", res.error || "Please check inputs.");
          return;
        }

        toast.success("Section created", `"${name.trim()}" domain added.`);
        if (res.data && onSuccess) {
          onSuccess(res.data);
        }
      }

      setIsLoading(false);
      onClose();
    } catch (err) {
      console.error("SectionModal error:", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("Section action failed", "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Rename & Edit Section" : "Create New Section"}
      description={
        isEditing
          ? "Update section details and color identification"
          : "Define a new category to organize your tasks, habits, and goals"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1" noValidate>
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        <Input
          label="Section Name"
          id="section-name"
          placeholder="e.g. Fitness, Engineering, Personal, Deep Work"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name?.[0]}
          required
          autoFocus
          disabled={isLoading}
          icon={<FolderPlus className="w-4 h-4 text-[var(--muted-foreground)]" />}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="section-desc"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]"
          >
            Description <span className="text-[var(--muted-foreground)] lowercase font-normal">(optional)</span>
          </label>
          <textarea
            id="section-desc"
            rows={2}
            className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)] resize-none"
            placeholder="Brief purpose of this section..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            disabled={isLoading}
          />
          {fieldErrors.description?.[0] && (
            <p className="text-xs text-red-500 font-medium">
              {fieldErrors.description[0]}
            </p>
          )}
        </div>

        {/* Color Palette Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Theme Color</span>
          </label>

          <div className="grid grid-cols-5 gap-2 pt-1">
            {PRESET_COLORS.map((preset) => {
              const isSelected = color.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setColor(preset.hex)}
                  className={cn(
                    "group relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer",
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-xs ring-2 ring-[var(--ring)]/30"
                      : "border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface-sub)]"
                  )}
                  title={preset.name}
                  disabled={isLoading}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shadow-xs transition-transform group-hover:scale-110"
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                  <span className="text-[9px] text-[var(--muted-foreground)] truncate max-w-full font-medium">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
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
            type="submit"
            size="sm"
            isLoading={isLoading}
            className="min-w-[100px]"
          >
            {isEditing ? "Save Changes" : "Create Section"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
