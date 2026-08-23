"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { HabitDTO, HabitFrequency, SectionDTO } from "@/types";
import { createHabitAction, updateHabitAction } from "@/server/actions/habit.actions";
import { Calendar, Flame, Folder, Repeat } from "lucide-react";

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
      // Default to weekdays for weekly
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
          return;
        }
        if (res.data && onSuccess) onSuccess(res.data);
      } else {
        const res = await createHabitAction(payload);
        if (!res.success) {
          setIsLoading(false);
          if (res.errors) setFieldErrors(res.errors);
          if (res.error) setError(res.error);
          return;
        }
        if (res.data && onSuccess) onSuccess(res.data);
      }

      setIsLoading(false);
      onClose();
    } catch (err) {
      console.error("HabitModal error:", err);
      setError("An unexpected error occurred. Please try again.");
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
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
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
          icon={<Flame className="w-4 h-4 text-amber-400" />}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="habit-desc"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Description / Cue & Reward{" "}
            <span className="text-slate-500 lowercase font-normal">(optional)</span>
          </label>
          <textarea
            id="habit-desc"
            rows={2}
            className="w-full rounded-xl glass-input px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
            placeholder="When and where will you perform this habit?..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            disabled={isLoading}
          />
        </div>

        {/* Section Selector */}
        {sections.length > 0 && (
          <div className="space-y-1.5">
            <label
              htmlFor="habit-section"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
            >
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>Section / Domain</span>
            </label>
            <select
              id="habit-section"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm text-slate-100 bg-slate-900 focus:outline-none cursor-pointer"
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
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-amber-400" />
            <span>Frequency</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleFrequencyChange("daily")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                frequency === "daily"
                  ? "bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/30 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60"
              }`}
            >
              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Every single day (7 days a week)
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleFrequencyChange("weekly")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                frequency === "weekly"
                  ? "bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/30 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60"
              }`}
            >
              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Specific Days</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Selected days of the week
              </p>
            </button>
          </div>
        </div>

        {/* Target Days Selector (for Weekly) */}
        {frequency === "weekly" && (
          <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
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
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 scale-105"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
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
            className="min-w-[100px] bg-amber-600 hover:bg-amber-500"
          >
            {isEditing ? "Save Changes" : "Create Habit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
