"use client";

import * as React from "react";
import { GoalDTO, SectionDTO } from "@/types";
import { GoalCard } from "./GoalCard";
import { GoalFormModal } from "./GoalFormModal";
import { QuickProgressModal } from "./QuickProgressModal";
import { FeatureGuideModal } from "@/components/ui/FeatureGuideModal";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  Layers,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

interface GoalsViewProps {
  initialGoals: GoalDTO[];
  sections: SectionDTO[];
}

type TabType = "active" | "completed" | "paused" | "all";

export function GoalsView({ initialGoals, sections }: GoalsViewProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>("active");
  const [selectedSection, setSelectedSection] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<GoalDTO | null>(null);

  const [isQuickProgressOpen, setIsQuickProgressOpen] = React.useState(false);
  const [quickProgressGoal, setQuickProgressGoal] = React.useState<GoalDTO | null>(null);

  // Filter goals
  const filteredGoals = React.useMemo(() => {
    return initialGoals.filter((g) => {
      // Tab filter
      if (activeTab === "active" && g.status !== "in_progress") return false;
      if (activeTab === "completed" && g.status !== "completed") return false;
      if (activeTab === "paused" && g.status !== "paused") return false;

      // Section filter
      if (selectedSection !== "all" && g.sectionId !== selectedSection) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = g.title.toLowerCase().includes(q);
        const matchDesc = g.description?.toLowerCase().includes(q);
        const matchUnit = g.unit.toLowerCase().includes(q);
        const matchSection = g.section?.name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchUnit && !matchSection) {
          return false;
        }
      }

      return true;
    });
  }, [initialGoals, activeTab, selectedSection, searchQuery]);

  // Overall Statistics
  const totalCount = initialGoals.length;
  const activeCount = initialGoals.filter((g) => g.status === "in_progress").length;
  const completedCount = initialGoals.filter((g) => g.status === "completed").length;
  const pausedCount = initialGoals.filter((g) => g.status === "paused").length;

  const avgProgress =
    totalCount > 0
      ? Math.round(
          initialGoals.reduce((sum, g) => sum + g.progressPercentage, 0) / totalCount
        )
      : 0;

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (goal: GoalDTO) => {
    setEditingGoal(goal);
    setIsFormModalOpen(true);
  };

  const handleOpenQuickProgress = (goal: GoalDTO) => {
    setQuickProgressGoal(goal);
    setIsQuickProgressOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-1.5">
              <Target className="w-4 h-4" />
              <span>Milestone Targets</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              Goals & Milestones
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1 max-w-xl leading-relaxed">
              Track quantifiable long-term objectives with custom units, progress steppers, and deadline timers.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <FeatureGuideModal
              featureName="Goals"
              title="How Goals & Milestones Work"
              subtitle="Set quantifiable targets and track long-term progress with visual progress bars."
              steps={[
                {
                  title: "Target Value & Custom Unit",
                  description: "Set a measurable target number and unit (e.g. Problems, Hours, Books, or Percent).",
                  example: "Target: 50 | Unit: Problems",
                },
                {
                  title: "One-Click Quick Progress",
                  description: "Use the quick +1 or +5 stepper buttons on any goal card to log completed increments without opening a form.",
                },
                {
                  title: "Automatic 100% Completion",
                  description: "Once your current progress reaches the target, the goal automatically completes and logs a milestone victory.",
                },
                {
                  title: "Pause and Resume",
                  description: "Temporarily pause goals when on vacation or reorganizing priorities without losing your saved progress.",
                },
              ]}
              tip="Progress cannot exceed the target value or go below zero, ensuring your completion percentage stays 100% accurate."
            />

            <Button
              onClick={handleOpenCreate}
              size="md"
              className="gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Goal</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Goals */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              Total Goals
            </span>
            <div className="w-7 h-7 rounded-lg bg-[var(--surface-sub)] flex items-center justify-center text-[var(--foreground)]">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">{totalCount}</div>
        </div>

        {/* Active Goals */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">
              Active Goals
            </span>
            <div className="w-7 h-7 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] flex items-center justify-center text-[var(--primary)]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">{activeCount}</div>
        </div>

        {/* Completed Goals */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">{completedCount}</div>
        </div>

        {/* Avg Progress */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[var(--secondary)] uppercase tracking-wider">
              Avg Progress
            </span>
            <div className="w-7 h-7 rounded-lg bg-[var(--secondary-soft)] border border-[var(--secondary)]/25 flex items-center justify-center text-[var(--secondary)]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">{avgProgress}%</div>
        </div>
      </div>

      {/* Filter Toolbar & Tab Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
        {/* Status Tabs */}
        <div className="flex items-center p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-x-auto shadow-xs self-start">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "active"
                ? "bg-[var(--primary)] text-white shadow-xs font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <span>Active</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-bold">
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "completed"
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <span>Completed</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-bold">
              {completedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("paused")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "paused"
                ? "bg-amber-600 text-white shadow-xs font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <span>Paused</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-bold">
              {pausedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "all"
                ? "bg-[var(--surface-sub)] text-[var(--foreground)] shadow-xs font-bold border border-[var(--border)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <span>All Goals</span>
            <span className="px-1.5 py-0.2 rounded-md bg-[var(--border)] text-[10px] font-bold">
              {totalCount}
            </span>
          </button>
        </div>

        {/* Section Filter & Search */}
        <div className="flex items-center gap-3">
          {/* Section Filter */}
          <div className="relative">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="appearance-none pl-8 pr-7 py-1.5 rounded-xl bg-[var(--input)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] cursor-pointer"
            >
              <option value="all">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Layers className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[var(--input)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)]"
            />
            <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center bg-[var(--surface)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft-border)] flex items-center justify-center mx-auto mb-3">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-1">
            {searchQuery || selectedSection !== "all" || activeTab !== "active"
              ? "No goals matching filter"
              : "No active goals yet"}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-sm mx-auto mb-6">
            {searchQuery || selectedSection !== "all" || activeTab !== "active"
              ? "Try adjusting your search terms or filter selection to find what you're looking for."
              : "Set your first quantifiable target, whether it's solving 100 coding problems or reading 12 books."}
          </p>
          <Button
            onClick={handleOpenCreate}
            size="md"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Goal</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleOpenEdit}
              onQuickProgress={handleOpenQuickProgress}
            />
          ))}
        </div>
      )}

      {/* Goal Create/Edit Modal */}
      <GoalFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialGoal={editingGoal}
        sections={sections}
      />

      {/* Quick Progress Stepper Modal */}
      <QuickProgressModal
        isOpen={isQuickProgressOpen}
        onClose={() => setIsQuickProgressOpen(false)}
        goal={quickProgressGoal}
      />
    </div>
  );
}
