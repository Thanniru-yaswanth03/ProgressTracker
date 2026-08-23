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
  task?: TaskDTO | null; // If provided, edit mode; else create mode
  sections: SectionDTO[];
  defaultSectionId?: string | null;
  onSuccess?: (savedTask: TaskDTO) => void;
}

const PRIORITIES: { id: TaskPriority; label: string; color: string; border: string }[] = [
  { id: "low", label: "Low", color: "text-slate-400 bg-slate-800/80", border: "border-slate-700" },
  { id: "medium", label: "Medium", color: "text-sky-400 bg-sky-500/10", border: "border-sky-500/30" },
  { id: "high", label: "High", color: "text-amber-400 bg-amber-500/10", border: "border-amber-500/30" },
  { id: "urgent", label: "Urgent", color: "text-rose-400 bg-rose-500/10", border: "border-rose-500/30" },
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
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
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
          icon={<CheckSquare className="w-4 h-4 text-slate-400" />}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="task-desc"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Description <span className="text-slate-500 lowercase font-normal">(optional)</span>
          </label>
          <textarea
            id="task-desc"
            rows={2}
            className="w-full rounded-xl glass-input px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
            placeholder="Add relevant notes, checklist pointers, or context..."
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
              htmlFor="task-section"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
            >
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>Section / Domain</span>
            </label>
            <select
              id="task-section"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm text-slate-100 bg-slate-900 focus:outline-none cursor-pointer"
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
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-indigo-400" />
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
                      ? `${p.color} ${p.border} ring-2 ring-indigo-500/40 shadow-sm`
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Due Date Picker */}
        <div className="space-y-1.5">
          <label
            htmlFor="task-due-date"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Due Date <span className="text-slate-500 lowercase font-normal">(optional)</span></span>
          </label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none"
            disabled={isLoading}
          />
        </div>

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
            className="min-w-[100px]"
          >
            {isEditing ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
