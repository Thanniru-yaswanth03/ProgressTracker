"use client";

import * as React from "react";
import { GoalDTO, SectionDTO, CreateGoalInput, UpdateGoalInput, GoalStatus } from "@/types";
import { createGoalAction, updateGoalAction } from "@/server/actions/goal.actions";
import { Calendar, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/providers/ToastProvider";

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: SectionDTO[];
  initialGoal?: GoalDTO | null;
  onSuccess?: (goal: GoalDTO) => void;
}

const COMMON_UNITS = [
  "problems",
  "hours",
  "percent",
  "books",
  "pages",
  "km",
  "sessions",
  "lessons",
];

export function GoalFormModal({
  isOpen,
  onClose,
  sections,
  initialGoal,
  onSuccess,
}: GoalFormModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = React.useTransition();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sectionId, setSectionId] = React.useState<string>("none");
  const [targetValue, setTargetValue] = React.useState<number>(100);
  const [currentValue, setCurrentValue] = React.useState<number>(0);
  const [unit, setUnit] = React.useState<string>("problems");
  const [targetDate, setTargetDate] = React.useState<string>("");
  const [status, setStatus] = React.useState<GoalStatus>("in_progress");

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const isEdit = !!initialGoal;

  React.useEffect(() => {
    if (isOpen) {
      if (initialGoal) {
        setTitle(initialGoal.title);
        setDescription(initialGoal.description || "");
        setSectionId(initialGoal.sectionId || "none");
        setTargetValue(initialGoal.targetValue);
        setCurrentValue(initialGoal.currentValue);
        setUnit(initialGoal.unit || "problems");
        setStatus(initialGoal.status);
        if (initialGoal.targetDate) {
          setTargetDate(initialGoal.targetDate.split("T")[0]);
        } else {
          setTargetDate("");
        }
      } else {
        setTitle("");
        setDescription("");
        setSectionId("none");
        setTargetValue(100);
        setCurrentValue(0);
        setUnit("problems");
        setTargetDate("");
        setStatus("in_progress");
      }
      setErrorMsg(null);
      setFieldErrors({});
    }
  }, [initialGoal, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    if (!title.trim()) {
      setErrorMsg("Goal title is required");
      return;
    }

    if (targetValue <= 0) {
      setErrorMsg("Target value must be greater than 0");
      return;
    }

    if (currentValue < 0) {
      setErrorMsg("Current progress cannot be negative");
      return;
    }

    if (currentValue > targetValue) {
      setErrorMsg("Current progress cannot exceed the target value");
      return;
    }

    const payloadSectionId = sectionId === "none" ? null : sectionId;

    startTransition(async () => {
      if (isEdit && initialGoal) {
        const updatePayload: UpdateGoalInput = {
          title: title.trim(),
          description: description.trim(),
          sectionId: payloadSectionId,
          targetValue,
          currentValue,
          unit: unit.trim() || "%",
          targetDate: targetDate || null,
          status,
        };

        const res = await updateGoalAction(initialGoal.id, updatePayload);
        if (!res.success) {
          setErrorMsg(res.error || "Failed to update goal");
          if (res.errors) setFieldErrors(res.errors);
          toast.error("Failed to update goal", res.error || "Please check inputs.");
        } else {
          toast.success("Goal updated", `"${title.trim()}" saved.`);
          router.refresh();
          onClose();
          if (onSuccess && res.data) onSuccess(res.data);
        }
      } else {
        const createPayload: CreateGoalInput = {
          title: title.trim(),
          description: description.trim(),
          sectionId: payloadSectionId,
          targetValue,
          currentValue,
          unit: unit.trim() || "%",
          targetDate: targetDate || null,
        };

        const res = await createGoalAction(createPayload);
        if (!res.success) {
          setErrorMsg(res.error || "Failed to create goal");
          if (res.errors) setFieldErrors(res.errors);
          toast.error("Failed to create goal", res.error || "Please check inputs.");
        } else {
          toast.success("Goal created", `"${title.trim()}" added to your targets.`);
          router.refresh();
          onClose();
          if (onSuccess && res.data) onSuccess(res.data);
        }
      }
    });
  };

  const currentPercent =
    targetValue > 0 ? Math.min(100, Math.max(0, Math.round((currentValue / targetValue) * 100))) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Goal" : "Create New Goal"}
      description={
        isEdit
          ? "Update target metrics and details"
          : "Define a quantifiable milestone with custom units and progress tracking"
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1" noValidate>
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Goal Title */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Goal Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={120}
            placeholder="e.g. Complete 70 DSA problems, Study MongoDB, Build App"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)] transition-all"
            disabled={isPending}
          />
          {fieldErrors.title && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.title[0]}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Description <span className="lowercase font-normal opacity-75">(optional)</span>
          </label>
          <textarea
            rows={2}
            maxLength={500}
            placeholder="Brief motivation, milestones, or notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)] transition-all resize-none"
            disabled={isPending}
          />
        </div>

        {/* Section Selector */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Section / Category
          </label>
          <div className="relative">
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ring)] appearance-none cursor-pointer"
              disabled={isPending}
            >
              <option value="none">No Section (General)</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
            <Layers className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
          </div>
        </div>

        {/* Target & Current Values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Target Value <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0.01}
              step="any"
              required
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ring)]"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Current Progress
            </label>
            <input
              type="number"
              min={0}
              max={targetValue}
              step="any"
              value={currentValue}
              onChange={(e) => setCurrentValue(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ring)]"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Unit Customization & Quick Suggestions */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Unit of Measurement
          </label>
          <input
            type="text"
            maxLength={20}
            placeholder="e.g. problems, hours, percent, pages, km"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ring)] mb-2"
            disabled={isPending}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-[var(--muted-foreground)] mr-1">Presets:</span>
            {COMMON_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                disabled={isPending}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                  unit.toLowerCase() === u.toLowerCase()
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-[var(--surface-sub)] text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Target Deadline Date */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Target Deadline <span className="lowercase font-normal opacity-75">(optional)</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ring)]"
              disabled={isPending}
            />
            <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
          </div>
        </div>

        {/* Edit-only Status Selector */}
        {isEdit && (
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Goal Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as GoalStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ring)] cursor-pointer"
              disabled={isPending}
            >
              <option value="in_progress">In Progress (Active)</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {/* Live Progress Preview */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] text-left">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[var(--muted-foreground)] font-medium">Calculated Initial Progress:</span>
            <span className="font-bold text-[var(--primary)]">
              {currentPercent}% ({currentValue} / {targetValue} {unit || "%"})
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
              style={{ width: `${currentPercent}%` }}
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            isLoading={isPending}
          >
            {isEdit ? "Save Changes" : "Create Goal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
