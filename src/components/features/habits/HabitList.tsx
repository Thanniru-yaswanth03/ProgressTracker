"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HabitDTO, SectionDTO } from "@/types";
import { HabitCard } from "./HabitCard";
import { HabitModal } from "./HabitModal";
import { DeleteHabitDialog } from "./DeleteHabitDialog";
import { HabitEmptyState } from "./HabitEmptyState";
import { HabitStatsHeader } from "./HabitStatsHeader";
import { Button } from "@/components/ui/Button";
import { Archive, Flame, Plus, Search } from "lucide-react";

export interface HabitListProps {
  initialHabits: HabitDTO[];
  sections: SectionDTO[];
  defaultSectionId?: string | null;
  hideStats?: boolean;
}

export function HabitList({
  initialHabits,
  sections,
  defaultSectionId,
  hideStats = false,
}: HabitListProps) {
  const router = useRouter();
  const [habits, setHabits] = React.useState<HabitDTO[]>(initialHabits);

  // Filters
  const [tab, setTab] = React.useState<"active" | "archived">("active");
  const [sectionFilter, setSectionFilter] = React.useState<string>(defaultSectionId || "all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingHabit, setEditingHabit] = React.useState<HabitDTO | null>(null);
  const [deletingHabit, setDeletingHabit] = React.useState<HabitDTO | null>(null);

  React.useEffect(() => {
    setHabits(initialHabits);
  }, [initialHabits]);

  const activeCount = habits.filter((h) => !h.archived).length;
  const archivedCount = habits.filter((h) => h.archived).length;

  const filteredHabits = React.useMemo(() => {
    return habits.filter((h) => {
      // Tab filter
      if (tab === "active" && h.archived) return false;
      if (tab === "archived" && !h.archived) return false;

      // Section filter
      if (sectionFilter !== "all") {
        if (sectionFilter === "none" && h.sectionId) return false;
        if (sectionFilter !== "none" && h.sectionId !== sectionFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = h.title.toLowerCase().includes(query);
        const matchDesc = h.description?.toLowerCase().includes(query);
        const matchSection = h.section?.name.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchSection) return false;
      }

      return true;
    });
  }, [habits, tab, sectionFilter, searchQuery]);

  const handleEdit = (habit: HabitDTO) => {
    setEditingHabit(habit);
  };

  const handleDelete = (habit: HabitDTO) => {
    setDeletingHabit(habit);
  };

  const handleMutationSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {!hideStats && <HabitStatsHeader habits={habits} />}

      {/* Control Bar: Tabs, Section Filter, Search & Create */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1">
        {/* Active vs Archived Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "active"
                ? "bg-amber-500 text-slate-950 shadow-sm font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Active Habits ({activeCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("archived")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "archived"
                ? "bg-amber-500 text-slate-950 shadow-sm font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived ({archivedCount})</span>
          </button>
        </div>

        {/* Search, Filter & Create Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[170px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl glass-input pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Section Filter Dropdown */}
          {!defaultSectionId && sections.length > 0 && (
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-xl glass-input px-3 py-1.5 text-xs text-slate-200 bg-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="all">All Domains</option>
              <option value="none">General (No Domain)</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Create Button */}
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="gap-1.5 shrink-0 shadow-md shadow-amber-500/20 bg-amber-600 hover:bg-amber-500 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Habit</span>
          </Button>
        </div>
      </div>

      {/* Habit Cards Grid or Empty State */}
      {habits.length === 0 ? (
        <HabitEmptyState onCreate={() => setIsCreateOpen(true)} />
      ) : filteredHabits.length === 0 ? (
        <HabitEmptyState onCreate={() => setIsCreateOpen(true)} filtered />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMutationSuccess={handleMutationSuccess}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <HabitModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        sections={sections}
        defaultSectionId={defaultSectionId}
        onSuccess={handleMutationSuccess}
      />

      {/* Edit Modal */}
      <HabitModal
        isOpen={!!editingHabit}
        habit={editingHabit}
        sections={sections}
        onClose={() => setEditingHabit(null)}
        onSuccess={handleMutationSuccess}
      />

      {/* Delete Dialog */}
      <DeleteHabitDialog
        isOpen={!!deletingHabit}
        habit={deletingHabit}
        onClose={() => setDeletingHabit(null)}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
}
