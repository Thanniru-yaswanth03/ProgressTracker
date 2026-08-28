"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ActivityDTO, SectionDTO } from "@/types";
import { createActivityAction, updateActivityAction } from "@/server/actions/activity.actions";
import { Calendar, Clock, Folder, Sparkles, Tag, X } from "lucide-react";

export interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: ActivityDTO | null;
  sections: SectionDTO[];
  defaultSectionId?: string | null;
  onSuccess?: (savedActivity: ActivityDTO) => void;
}

export function ActivityModal({
  isOpen,
  onClose,
  activity,
  sections,
  defaultSectionId,
  onSuccess,
}: ActivityModalProps) {
  const isEditing = !!activity;

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sectionId, setSectionId] = React.useState<string>("");
  const [duration, setDuration] = React.useState<number>(30);
  const [occurredAt, setOccurredAt] = React.useState<string>("");
  const [tagInput, setTagInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);

  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (activity) {
        setTitle(activity.title);
        setDescription(activity.description || "");
        setSectionId(activity.sectionId || "");
        setDuration(activity.duration || 0);
        setTags(activity.tags || []);
        // Format ISO date to YYYY-MM-DDTHH:mm
        const dateObj = new Date(activity.occurredAt);
        const tzOffset = dateObj.getTimezoneOffset() * 60000;
        const localISOTime = new Date(dateObj.getTime() - tzOffset)
          .toISOString()
          .slice(0, 16);
        setOccurredAt(localISOTime);
      } else {
        setTitle("");
        setDescription("");
        setSectionId(defaultSectionId || (sections[0]?.id || ""));
        setDuration(30);
        setTags([]);
        // Current local time
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now.getTime() - tzOffset)
          .toISOString()
          .slice(0, 16);
        setOccurredAt(localISOTime);
      }
      setTagInput("");
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, activity, defaultSectionId, sections]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/^[#,]+|[#,]+$/g, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
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
        duration: Number(duration) || 0,
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
        tags,
      };

      if (isEditing && activity) {
        const res = await updateActivityAction(activity.id, payload);
        if (!res.success) {
          setIsLoading(false);
          if (res.errors) setFieldErrors(res.errors);
          if (res.error) setError(res.error);
          return;
        }
        if (res.data && onSuccess) onSuccess(res.data);
      } else {
        const res = await createActivityAction(payload);
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
      console.error("ActivityModal error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Activity Record" : "Log Completed Activity"}
      description={
        isEditing
          ? "Update details of this completed work or accomplishment"
          : "Record work, study, workouts, or milestones you actually completed"
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
          label="Activity Title"
          id="activity-title"
          placeholder="e.g. 45-min Deep Focus Coding Session"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title?.[0]}
          required
          autoFocus
          disabled={isLoading}
          icon={<Sparkles className="w-4 h-4 text-emerald-500" />}
        />

        <div className="space-y-1.5 text-left">
          <label
            htmlFor="activity-desc"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
          >
            Description / Summary Notes{" "}
            <span className="lowercase font-normal opacity-75">(optional)</span>
          </label>
          <textarea
            id="activity-desc"
            rows={2}
            className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)] resize-none"
            placeholder="What did you achieve, discover, or finish?..."
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
              htmlFor="activity-section"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5"
            >
              <Folder className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Section / Domain</span>
            </label>
            <select
              id="activity-section"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] cursor-pointer"
              disabled={isLoading}
            >
              <option value="">No Section (General Accomplishment)</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Duration & Presets */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label
              htmlFor="activity-duration"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              <span>Duration (Minutes)</span>
            </label>
            <div className="flex items-center gap-1">
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                    duration === mins
                      ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40 font-bold"
                      : "bg-[var(--surface-sub)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
          <input
            id="activity-duration"
            type="number"
            min="0"
            max="1440"
            value={duration}
            onChange={(e) => setDuration(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
            disabled={isLoading}
          />
        </div>

        {/* Date & Time Completed */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="activity-date"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <span>Date & Time Completed</span>
          </label>
          <input
            id="activity-date"
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
            disabled={isLoading}
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span>Tags & Categorization</span>
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. deep-work, gym, reading (press Enter to add)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="flex-1 rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2 text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--ring)]"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || isLoading}
            >
              Add Tag
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft-border)]"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500 cursor-pointer"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

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
            {isEditing ? "Save Changes" : "Log Activity"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
