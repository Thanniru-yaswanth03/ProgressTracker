"use client";

import * as React from "react";
import { GoalDTO, SectionDTO } from "@/types";
import { GoalCard } from "./GoalCard";
import { GoalFormModal } from "./GoalFormModal";
import { QuickProgressModal } from "./QuickProgressModal";
import { FeatureGuideModal } from "@/components/ui/FeatureGuideModal";
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
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-white dark:via-slate-900/90 to-slate-50 dark:to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-xl dark:shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Target className="w-4 h-4" />
              <span>Milestone System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Goals & Targets
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              Track quantifiable long-term objectives with custom units, progress steppers, and deadline timers.
            </p>
          </div>

          <div className="flex items-center gap-3">
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

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Goal</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Goals */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Goals
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{totalCount}</div>
        </div>

        {/* Active Goals */}
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              Active Goals
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{activeCount}</div>
        </div>

        {/* Completed Goals */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{completedCount}</div>
        </div>

        {/* Avg Progress */}
        <div className="rounded-2xl border border-sky-200 dark:border-sky-500/20 bg-sky-50/50 dark:bg-sky-950/20 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
              Avg Progress
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{avgProgress}%</div>
        </div>
      </div>

      {/* Filter Toolbar & Tab Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "active"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>Active</span>
            <span className="px-1.5 py-0.2 rounded-md bg-indigo-950/30 text-[10px] font-bold">
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "completed"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>Completed</span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-950/30 text-[10px] font-bold">
              {completedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("paused")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "paused"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>Paused</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-950/30 text-[10px] font-bold">
              {pausedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "all"
                ? "bg-slate-700 text-white shadow-md shadow-slate-700/30"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>All Goals</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] font-bold">
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
              className="appearance-none pl-9 pr-8 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="all">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {searchQuery || selectedSection !== "all" || activeTab !== "active"
              ? "No goals matching filter"
              : "No active goals yet"}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto mb-6">
            {searchQuery || selectedSection !== "all" || activeTab !== "active"
              ? "Try adjusting your search terms or filter selection to find what you're looking for."
              : "Set your first quantifiable target, whether it's solving 100 coding problems or reading 12 books."}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
