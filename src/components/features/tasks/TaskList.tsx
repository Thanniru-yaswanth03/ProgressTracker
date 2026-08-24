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
        <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "pending"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "completed"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search, Filter Dropdowns & Create Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl glass-input pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Section Filter Dropdown (if not inside a single section view) */}
          {!defaultSectionId && sections.length > 0 && (
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-xl glass-input px-3 py-1.5 text-xs text-slate-200 bg-slate-900 focus:outline-none cursor-pointer"
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
            className="rounded-xl glass-input px-3 py-1.5 text-xs text-slate-200 bg-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Create Task Button */}
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="gap-1.5 shrink-0 shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Task Cards Grid or Empty State */}
      {tasks.length === 0 ? (
        <TaskEmptyState onCreate={() => setIsCreateOpen(true)} />
      ) : filteredTasks.length === 0 ? (
        <TaskEmptyState onCreate={() => setIsCreateOpen(true)} filtered />
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
        onSuccess={handleMutationSuccess}
      />

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={!!editingTask}
        task={editingTask}
        sections={sections}
        onClose={() => setEditingTask(null)}
        onSuccess={handleMutationSuccess}
      />

      {/* Delete Task Dialog */}
      <DeleteTaskDialog
        isOpen={!!deletingTask}
        task={deletingTask}
        onClose={() => setDeletingTask(null)}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
}
