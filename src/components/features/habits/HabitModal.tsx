"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { HabitDTO, HabitFrequency, SectionDTO } from "@/types";
import { createHabitAction, updateHabitAction } from "@/server/actions/habit.actions";
import { Calendar, Flame, Folder, Repeat } from "lucide-react";

import { useToast } from "@/components/providers/ToastProvider";

export interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit?: HabitDTO | null;
  sections: SectionDTO[];
  defaultSectionId?: string | null;
  onSuccess?: (savedHabit: HabitDTO) => void;
}

const DAYS = [
  { day: 1, label: "M", full: "Mon" },
  { day: 2, label: "T", full: "Tue" },
  { day: 3, label: "W", full: "Wed" },
  { day: 4, label: "T", full: "Thu" },
  { day: 5, label: "F", full: "Fri" },
  { day: 6, label: "S", full: "Sat" },
  { day: 0, label: "S", full: "Sun" },
];

export function HabitModal({
  isOpen,
  onClose,
  habit,
  sections,
  defaultSectionId,
  onSuccess,
}: HabitModalProps) {
  const toast = useToast();
  const isEditing = !!habit;

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sectionId, setSectionId] = React.useState<string>("");
  const [frequency, setFrequency] = React.useState<HabitFrequency>("daily");
  const [targetDays, setTargetDays] = React.useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (habit) {
        setTitle(habit.title);
        setDescription(habit.description || "");
        setSectionId(habit.sectionId || "");
        setFrequency(habit.frequency);
        setTargetDays(habit.targetDays || [0, 1, 2, 3, 4, 5, 6]);
      } else {
        setTitle("");
        setDescription("");
        setSectionId(defaultSectionId || (sections[0]?.id || ""));
        setFrequency("daily");
        setTargetDays([0, 1, 2, 3, 4, 5, 6]);
      }
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, habit, defaultSectionId, sections]);

  const handleToggleDay = (day: number) => {
    if (targetDays.includes(day)) {
      if (targetDays.length > 1) {
        setTargetDays(targetDays.filter((d) => d !== day));
      }
    } else {
      setTargetDays([...targetDays, day].sort());
    }
  };

  const handleFrequencyChange = (nextFreq: HabitFrequency) => {
    setFrequency(nextFreq);
    if (nextFreq === "daily") {
      setTargetDays([0, 1, 2, 3, 4, 5, 6]);
    } else if (targetDays.length === 7) {
      setTargetDays([1, 2, 3, 4, 5]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        sectionId: sectionId || null,
        frequency,
        targetDays: frequency === "daily" ? [0, 1, 2, 3, 4, 5, 6] : targetDays,
      };

      if (isEditing && habit) {
        const res = await updateHabitAction(habit.id, payload);
        if (!res.success) {
          setIsLoading(false);
          if (res.errors) setFieldErrors(res.errors);
          if (res.error) setError(res.error);
          toast.error("Failed to update habit", res.error || "Please check the form inputs.");
          return;
        }
        toast.success("Habit updated", `"${payload.title}" saved.`);
        if (res.data && onSuccess) onSuccess(res.data);
      } else {
        const res = await createHabitAction(payload);
        if (!res.success) {
          setIsLoading(false);
          if (res.errors) setFieldErrors(res.errors);
          if (res.error) setError(res.error);
          toast.error("Failed to create habit", res.error || "Please check the form inputs.");
          return;
        }
        toast.success("Habit created", `"${payload.title}" routine started!`);
        if (res.data && onSuccess) onSuccess(res.data);
      }

      setIsLoading(false);
      onClose();
    } catch (err) {
      console.error("HabitModal error:", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("Habit action failed", "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Habit" : "Create New Habit"}
      description={
        isEditing
          ? "Update habit routine, schedule days, or domain"
          : "Build a lasting daily or weekly routine to track consistent streaks"
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1" noValidate>
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        <Input
          label="Habit Routine Name"
          id="habit-title"
          placeholder="e.g. Read 20 pages of non-fiction"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title?.[0]}
          required
          autoFocus
          disabled={isLoading}
          icon={<Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
        />

        <div className="space-y-1.5 text-left">
          <label
            htmlFor="habit-desc"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
          >
            Description / Cue & Reward{" "}
            <span className="lowercase font-normal opacity-75">(optional)</span>
          </label>
          <textarea
            id="habit-desc"
            rows={2}
            className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)] resize-none"
            placeholder="When and where will you perform this habit?..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            disabled={isLoading}
          />
        </div>

        {/* Section Selector */}
        {sections.length > 0 && (
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="habit-section"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5"
            >
              <Folder className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Section / Domain</span>
            </label>
            <select
              id="habit-section"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] cursor-pointer"
              disabled={isLoading}
            >
              <option value="">No Section (General Habit)</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Frequency Choice */}
        <div className="space-y-2 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Frequency</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleFrequencyChange("daily")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                frequency === "daily"
                  ? "bg-amber-500/15 border-amber-500/40 ring-2 ring-amber-500/30 text-[var(--foreground)]"
                  : "bg-[var(--surface-sub)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Daily</span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                Every single day (7 days a week)
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleFrequencyChange("weekly")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                frequency === "weekly"
                  ? "bg-amber-500/15 border-amber-500/40 ring-2 ring-amber-500/30 text-[var(--foreground)]"
                  : "bg-[var(--surface-sub)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-500" />
                <span>Specific Days</span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                Selected days of the week
              </p>
            </button>
          </div>
        </div>

        {/* Target Days Selector (for Weekly) */}
        {frequency === "weekly" && (
          <div className="space-y-1.5 pt-1 text-left animate-enter-fade">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Schedule Target Days
            </label>
            <div className="flex items-center justify-between gap-1.5">
              {DAYS.map((d) => {
                const isSelected = targetDays.includes(d.day);
                return (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => handleToggleDay(d.day)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? "bg-amber-500 text-white border-amber-400 shadow-xs scale-105"
                        : "bg-[var(--surface-sub)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <span>{d.label}</span>
                    <span className="text-[9px] opacity-75">{d.full}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Actions */}
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
            {isEditing ? "Save Changes" : "Create Habit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
