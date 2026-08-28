"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SectionDTO, TaskDTO, TaskPriority } from "@/types";
import { createTaskAction, updateTaskAction } from "@/server/actions/task.actions";
import { Calendar, CheckSquare, Flag, Folder } from "lucide-react";

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: TaskDTO | null;
  sections: SectionDTO[];
  defaultSectionId?: string | null;
  onSuccess?: (savedTask: TaskDTO) => void;
}

const PRIORITIES: { id: TaskPriority; label: string; color: string; border: string }[] = [
  { id: "low", label: "Low", color: "text-[var(--muted-foreground)] bg-[var(--surface-sub)]", border: "border-[var(--border)]" },
  { id: "medium", label: "Medium", color: "text-sky-700 dark:text-sky-400 bg-sky-500/10", border: "border-sky-500/30" },
  { id: "high", label: "High", color: "text-amber-700 dark:text-amber-400 bg-amber-500/10", border: "border-amber-500/30" },
  { id: "urgent", label: "Urgent", color: "text-rose-700 dark:text-rose-400 bg-rose-500/10", border: "border-rose-500/30" },
];

export function TaskModal({
  isOpen,
  onClose,
  task,
  sections,
  defaultSectionId,
  onSuccess,
}: TaskModalProps) {
  const isEditing = !!task;

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sectionId, setSectionId] = React.useState<string>("");
  const [priority, setPriority] = React.useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = React.useState<string>("");

  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || "");
        setSectionId(task.sectionId || "");
        setPriority(task.priority || "medium");
        setDueDate(
          task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
        );
      } else {
        setTitle("");
        setDescription("");
        setSectionId(defaultSectionId || (sections[0]?.id || ""));
        setPriority("medium");
        setDueDate("");
      }
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, task, defaultSectionId, sections]);

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
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };

      if (isEditing && task) {
        const res = await updateTaskAction(task.id, payload);
        if (!res.success) {
          setIsLoading(false);
          if (res.errors) setFieldErrors(res.errors);
          if (res.error) setError(res.error);
          return;
        }

        if (res.data && onSuccess) onSuccess(res.data);
      } else {
        const res = await createTaskAction(payload);
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
      console.error("TaskModal error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Task" : "Create New Task"}
      description={
        isEditing
          ? "Update task details, due date, or priority"
          : "Add an actionable item to keep momentum going"
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
          label="Task Title"
          id="task-title"
          placeholder="e.g. Complete quarterly report analysis"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title?.[0]}
          required
          autoFocus
          disabled={isLoading}
          icon={<CheckSquare className="w-4 h-4 text-[var(--muted-foreground)]" />}
        />

        <div className="space-y-1.5 text-left">
          <label
            htmlFor="task-desc"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
          >
            Description <span className="lowercase font-normal opacity-75">(optional)</span>
          </label>
          <textarea
            id="task-desc"
            rows={2}
            className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60 focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)] resize-none"
            placeholder="Add relevant notes, checklist pointers, or context..."
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
              htmlFor="task-section"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5"
            >
              <Folder className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Section / Domain</span>
            </label>
            <select
              id="task-section"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] cursor-pointer"
              disabled={isLoading}
            >
              <option value="">No Section (General)</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Priority Selector */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Priority Level</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map((p) => {
              const isSelected = priority === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  disabled={isLoading}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    isSelected
                      ? `${p.color} ${p.border} ring-2 ring-[var(--ring)]/40 shadow-xs font-bold`
                      : "bg-[var(--surface-sub)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Due Date Picker */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="task-due-date"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Due Date <span className="lowercase font-normal opacity-75">(optional)</span></span>
          </label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)]"
            disabled={isLoading}
          />
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
            {isEditing ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
