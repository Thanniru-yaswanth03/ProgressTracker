"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SectionDTO } from "@/types";
import { createSectionAction, updateSectionAction } from "@/server/actions/section.actions";
import { Check, FolderPlus, Palette } from "lucide-react";

export const PRESET_COLORS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Sky Blue", hex: "#0ea5e9" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Orange", hex: "#f97316" },
];

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
  const isEditing = !!section;

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState("#6366f1");
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  // Sync state when section prop changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (section) {
        setName(section.name);
        setDescription(section.description || "");
        setColor(section.color || "#6366f1");
      } else {
        setName("");
        setDescription("");
        setColor("#6366f1");
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
          return;
        }

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
          return;
        }

        if (res.data && onSuccess) {
          onSuccess(res.data);
        }
      }

      setIsLoading(false);
      onClose();
    } catch (err) {
      console.error("SectionModal error:", err);
      setError("An unexpected error occurred. Please try again.");
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
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <Input
          label="Section Name"
          id="section-name"
          placeholder="e.g. Fitness, Work, Personal, Side Project"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name?.[0]}
          required
          autoFocus
          disabled={isLoading}
          icon={<FolderPlus className="w-4 h-4 text-slate-400" />}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="section-desc"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Description <span className="text-slate-500 lowercase font-normal">(optional)</span>
          </label>
          <textarea
            id="section-desc"
            rows={2}
            className="w-full rounded-xl glass-input px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
            placeholder="Brief purpose of this section..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            disabled={isLoading}
          />
          {fieldErrors.description?.[0] && (
            <p className="text-xs text-red-400 font-medium">
              {fieldErrors.description[0]}
            </p>
          )}
        </div>

        {/* Color Palette Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <span>Theme Color</span>
          </label>

          <div className="grid grid-cols-5 gap-2.5 pt-1">
            {PRESET_COLORS.map((preset) => {
              const isSelected = color.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setColor(preset.hex)}
                  className={`group relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-white/50 bg-slate-800 shadow-md ring-2 ring-indigo-500/50"
                      : "border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800/60"
                  }`}
                  title={preset.name}
                  disabled={isLoading}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shadow-inner transition-transform group-hover:scale-110"
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-full font-medium">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
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
