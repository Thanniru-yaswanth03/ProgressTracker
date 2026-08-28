"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SectionDTO, TaskDTO, TaskPriority, TaskStatus } from "@/types";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { TaskEmptyState } from "./TaskEmptyState";
import { TaskStatsHeader } from "./TaskStatsHeader";
import { Button } from "@/components/ui/Button";
import { FeatureGuideModal } from "@/components/ui/FeatureGuideModal";
import { Plus, Search } from "lucide-react";

export interface TaskListProps {
  initialTasks: TaskDTO[];
  sections: SectionDTO[];
  defaultSectionId?: string | null;
  hideStats?: boolean;
}

export function TaskList({
  initialTasks,
  sections,
  defaultSectionId,
  hideStats = false,
}: TaskListProps) {
  const router = useRouter();
  const [tasks, setTasks] = React.useState<TaskDTO[]>(initialTasks);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<TaskStatus | "all">("all");
  const [sectionFilter, setSectionFilter] = React.useState<string>(defaultSectionId || "all");
  const [priorityFilter, setPriorityFilter] = React.useState<TaskPriority | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<TaskDTO | null>(null);
  const [deletingTask, setDeletingTask] = React.useState<TaskDTO | null>(null);

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) return false;

      // Section filter
      if (sectionFilter !== "all") {
        if (sectionFilter === "none" && task.sectionId) return false;
        if (sectionFilter !== "none" && task.sectionId !== sectionFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchDesc = task.description?.toLowerCase().includes(query);
        const matchSection = task.section?.name.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchSection) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, sectionFilter, priorityFilter, searchQuery]);

  const handleEdit = (task: TaskDTO) => {
    setEditingTask(task);
  };

  const handleDelete = (task: TaskDTO) => {
    setDeletingTask(task);
  };

  const handleMutationSuccess = () => {
    router.refresh();
  };

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {!hideStats && <TaskStatsHeader tasks={tasks} />}

      {/* Control Bar: Status Tabs, Section / Priority Filter, Search & Create */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
        {/* Status Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs self-start">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-[var(--primary)] text-white shadow-xs font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "pending"
                ? "bg-[var(--primary)] text-white shadow-xs font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "completed"
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search, Filter Dropdowns, How-To Guide & Create Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] pl-9 pr-3 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)]"
            />
          </div>

          {/* Section Filter Dropdown */}
          {!defaultSectionId && sections.length > 0 && (
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-xl bg-[var(--input)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] cursor-pointer"
            >
              <option value="all">All Sections</option>
              <option value="none">General (No Section)</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "all")}
            className="rounded-xl bg-[var(--input)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Task How-To Guide */}
          <FeatureGuideModal
            featureName="Tasks"
            title="How Tasks Work"
            subtitle="Plan, organize, and complete daily actions with automatic activity synchronization."
            steps={[
              {
                title: "Create an Action Item",
                description: "Give your task a clear, descriptive title representing a concrete outcome.",
                example: "Deploy ProgressTracker to Vercel",
              },
              {
                title: "Set Priority & Due Date",
                description: "Assign Urgent for must-do today items, High for this week, or Medium/Low for backlog items.",
              },
              {
                title: "Organize into Sections",
                description: "Group tasks into specific life buckets like 'Work', 'Health', or 'Study' for focused filtering.",
              },
              {
                title: "Check Off & Automatic Activity Logging",
                description: "Checking off a task marks it completed and automatically records an activity entry in your timeline and daily history.",
              },
            ]}
            tip="If you reopen a completed task, its auto-activity entry is cleanly removed so your history stays 100% accurate."
          />

          {/* Create Task Button */}
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="gap-1.5 shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Task List Grid / Empty State */}
      {filteredTasks.length === 0 ? (
        <TaskEmptyState
          filtered={
            statusFilter !== "all" ||
            sectionFilter !== "all" ||
            priorityFilter !== "all" ||
            searchQuery.trim().length > 0
          }
          onCreate={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleSuccess={handleMutationSuccess}
            />
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <TaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        sections={sections}
        defaultSectionId={defaultSectionId}
        onSuccess={(savedTask) => {
          setIsCreateOpen(false);
          setTasks((prev) => [savedTask, ...prev.filter((t) => t.id !== savedTask.id)]);
          handleMutationSuccess();
        }}
      />

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        sections={sections}
        onSuccess={(savedTask) => {
          setEditingTask(null);
          setTasks((prev) => prev.map((t) => (t.id === savedTask.id ? savedTask : t)));
          handleMutationSuccess();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTaskDialog
        isOpen={!!deletingTask}
        task={deletingTask}
        onClose={() => setDeletingTask(null)}
        onSuccess={(deletedTaskId) => {
          const idToRemove = deletedTaskId || deletingTask?.id;
          if (idToRemove) {
            setTasks((prev) => prev.filter((t) => t.id !== idToRemove));
          }
          setDeletingTask(null);
          handleMutationSuccess();
        }}
      />
    </div>
  );
}
