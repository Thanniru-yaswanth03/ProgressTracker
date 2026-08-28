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
import { FeatureGuideModal } from "@/components/ui/FeatureGuideModal";
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

      {/* Control Bar: Tabs, Section Filter, Search, How-To Guide & Create */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1">
        {/* Active vs Archived Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs self-start">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "active"
                ? "bg-[var(--primary)] text-white shadow-xs font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Active ({activeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("archived")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "archived"
                ? "bg-[var(--surface-sub)] text-[var(--foreground)] shadow-xs font-bold border border-[var(--border)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived ({archivedCount})</span>
          </button>
        </div>

        {/* Search, Filter, Guide & Create Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search habits..."
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

          {/* Habit How-To Guide */}
          <FeatureGuideModal
            featureName="Habits"
            title="How Habits & Streaks Work"
            subtitle="Build lasting routines with deterministic streak calculation and weekly schedules."
            steps={[
              {
                title: "Choose Daily or Weekly",
                description: "Daily habits track every day. Weekly habits let you pick target days (e.g. Mon/Wed/Fri).",
                example: "Daily Meditation or Mon/Wed/Fri Gym Workout",
              },
              {
                title: "Check In Daily",
                description: "Click today's checkbox on your habit card to log your completion for the date.",
              },
              {
                title: "Consecutive Streak Progression",
                description: "Streaks increase for each consecutive scheduled day you complete. If today isn't logged yet, you have a grace period until end of day before your streak resets.",
              },
              {
                title: "Longest Streak Record",
                description: "Your highest historical streak is permanently saved and celebrated on your profile and analytics dashboard.",
              },
            ]}
            tip="Checking in a habit also records an activity entry for that date and counts toward your daily completion score."
          />

          {/* Create Habit Button */}
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="gap-1.5 shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
          </Button>
        </div>
      </div>

      {/* Habit Cards Grid / Empty State */}
      {filteredHabits.length === 0 ? (
        <HabitEmptyState
          filtered={tab === "archived" || sectionFilter !== "all" || searchQuery.trim().length > 0}
          onCreate={() => setIsCreateOpen(true)}
        />
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

      {/* Create Habit Modal */}
      <HabitModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        sections={sections}
        defaultSectionId={defaultSectionId}
        onSuccess={(savedHabit) => {
          setIsCreateOpen(false);
          setHabits((prev) => [savedHabit, ...prev.filter((h) => h.id !== savedHabit.id)]);
          handleMutationSuccess();
        }}
      />

      {/* Edit Habit Modal */}
      <HabitModal
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        habit={editingHabit}
        sections={sections}
        onSuccess={(savedHabit) => {
          setEditingHabit(null);
          setHabits((prev) => prev.map((h) => (h.id === savedHabit.id ? savedHabit : h)));
          handleMutationSuccess();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteHabitDialog
        isOpen={!!deletingHabit}
        habit={deletingHabit}
        onClose={() => setDeletingHabit(null)}
        onSuccess={(deletedHabitId) => {
          const idToRemove = deletedHabitId || deletingHabit?.id;
          if (idToRemove) {
            setHabits((prev) => prev.filter((h) => h.id !== idToRemove));
          }
          setDeletingHabit(null);
          handleMutationSuccess();
        }}
      />
    </div>
  );
}
