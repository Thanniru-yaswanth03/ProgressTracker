import * as React from "react";
import { requireUser } from "@/server/auth/session";
import { taskService } from "@/server/services/task.service";
import { sectionService } from "@/server/services/section.service";
import { TaskList } from "@/components/features/tasks/TaskList";
import { CheckSquare } from "lucide-react";

export const metadata = {
  title: "Tasks — Progress Tracker",
  description: "Manage, prioritize, and track your daily tasks and action items.",
};

export default async function TasksPage() {
  const user = await requireUser();
  const [tasks, sections] = await Promise.all([
    taskService.getTasks(user.id),
    sectionService.getSections(user.id),
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Execution & Productivity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Action Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track, prioritize, and check off one-off and recurring tasks across your focus sections.
          </p>
        </div>
      </div>

      {/* Main Task List */}
      <TaskList initialTasks={tasks} sections={sections} />
    </div>
  );
}
