"use client";

import * as React from "react";
import { GoalDTO, SectionDTO } from "@/types";
import { GoalCard } from "./GoalCard";
import { GoalFormModal } from "./GoalFormModal";
import { QuickProgressModal } from "./QuickProgressModal";
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
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Target className="w-4 h-4" />
              <span>Milestone System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Goals & Targets
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Track quantifiable long-term objectives with custom units, progress steppers, and deadline timers.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Goals */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Goals
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{totalCount}</div>
        </div>

        {/* Active Goals */}
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              Active Goals
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{activeCount}</div>
        </div>

        {/* Completed Goals */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{completedCount}</div>
        </div>

        {/* Avg Progress */}
        <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
              Avg Progress
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{avgProgress}%</div>
        </div>
      </div>

      {/* Filter Toolbar & Tab Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "active"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Active</span>
            <span className="px-1.5 py-0.2 rounded-md bg-indigo-950/60 text-[10px] font-bold">
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "completed"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Completed</span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-950/60 text-[10px] font-bold">
              {completedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("paused")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "paused"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Paused</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-950/60 text-[10px] font-bold">
              {pausedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "all"
                ? "bg-slate-750 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>All Goals</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] font-bold">
              {totalCount}
            </span>
          </button>
        </div>

        {/* Section & Search Controls */}
        <div className="flex items-center gap-2.5">
          {/* Section Dropdown */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">All Sections</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
            <Layers className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative min-w-[180px]">
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length > 0 ? (
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
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/30">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {activeTab === "completed"
              ? "No completed goals yet"
              : activeTab === "paused"
              ? "No paused goals"
              : "No goals found"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            {searchQuery
              ? "Try adjusting your search query or section filters."
              : activeTab === "completed"
              ? "Keep progressing towards your targets to see finished milestones here."
              : "Create your first goal to track problems solved, books read, hours studied, or custom milestones."}
          </p>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Goal</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <GoalFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        sections={sections}
        initialGoal={editingGoal}
      />

      <QuickProgressModal
        isOpen={isQuickProgressOpen}
        onClose={() => setIsQuickProgressOpen(false)}
        goal={quickProgressGoal}
      />
    </div>
  );
}
