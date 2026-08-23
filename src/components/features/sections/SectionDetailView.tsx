"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ActivityDTO, HabitDTO, SectionDTO, TaskDTO } from "@/types";
import { Button } from "@/components/ui/Button";
import { SectionModal } from "./SectionModal";
import { DeleteSectionDialog } from "./DeleteSectionDialog";
import { TaskList } from "@/components/features/tasks/TaskList";
import { HabitList } from "@/components/features/habits/HabitList";
import { ActivityTimeline } from "@/components/features/activities/ActivityTimeline";
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Edit2,
  Flame,
  Folder,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export interface SectionDetailViewProps {
  section: SectionDTO;
  tasks?: TaskDTO[];
  habits?: HabitDTO[];
  activities?: ActivityDTO[];
  allSections?: SectionDTO[];
}

export function SectionDetailView({
  section: initialSection,
  tasks = [],
  habits = [],
  activities = [],
  allSections = [],
}: SectionDetailViewProps) {
  const router = useRouter();
  const [section, setSection] = React.useState<SectionDTO>(initialSection);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  const formattedCreated = new Date(section.createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedUpdated = new Date(section.updatedAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleEditSuccess = (updated: SectionDTO) => {
    setSection(updated);
    router.refresh();
  };

  const handleDeleteSuccess = () => {
    router.push("/sections");
    router.refresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumb & Top Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/sections"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Sections</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Rename / Edit</span>
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Hero Section Banner */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 border glass-panel shadow-2xl"
        style={{
          borderColor: `${section.color || "#6366f1"}40`,
        }}
      >
        <div
          className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: section.color || "#6366f1" }}
        />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{
                backgroundColor: `${section.color || "#6366f1"}30`,
                borderColor: `${section.color || "#6366f1"}60`,
                borderWidth: "1px",
              }}
            >
              <Folder className="w-6 h-6" style={{ color: section.color || "#6366f1" }} />
            </div>
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-1"
                style={{
                  color: section.color || "#6366f1",
                  backgroundColor: `${section.color || "#6366f1"}15`,
                  borderColor: `${section.color || "#6366f1"}30`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: section.color || "#6366f1" }}
                />
                Active Domain
              </span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {section.name}
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            {section.description || "No description specified for this section."}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Created: {formattedCreated}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>Last Modified: {formattedUpdated}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Planned Tasks in this Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Planned Tasks
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {tasks.length} task{tasks.length === 1 ? "" : "s"}
          </span>
        </div>

        <TaskList
          initialTasks={tasks}
          sections={allSections.length > 0 ? allSections : [section]}
          defaultSectionId={section.id}
          hideStats
        />
      </div>

      {/* Habits in this Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Habits & Streaks in {section.name}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {habits.length} routine{habits.length === 1 ? "" : "s"}
          </span>
        </div>

        <HabitList
          initialHabits={habits}
          sections={allSections.length > 0 ? allSections : [section]}
          defaultSectionId={section.id}
          hideStats
        />
      </div>

      {/* Completed Activities in this Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Completed Activities & Work Sessions
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {activities.length} completed
          </span>
        </div>

        <ActivityTimeline
          initialActivities={activities}
          sections={allSections.length > 0 ? allSections : [section]}
          defaultSectionId={section.id}
          hideStats
        />
      </div>

      {/* Edit Modal */}
      <SectionModal
        isOpen={isEditOpen}
        section={section}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Dialog */}
      <DeleteSectionDialog
        isOpen={isDeleteOpen}
        section={section}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
