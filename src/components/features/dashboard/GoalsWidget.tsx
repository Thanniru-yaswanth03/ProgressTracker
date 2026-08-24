"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GoalDTO, SectionDTO } from "@/types";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createGoalAction, updateGoalAction } from "@/server/actions/goal.actions";
import { ChevronRight, Clock, Edit2, Folder, Plus, Target } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface GoalsWidgetProps {
  goals: GoalDTO[];
  sections: SectionDTO[];
}

export function GoalsWidget({ goals: initialGoals, sections }: GoalsWidgetProps) {
  const router = useRouter();
  const [goals, setGoals] = React.useState<GoalDTO[]>(initialGoals);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<GoalDTO | null>(null);

  // Form State
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sectionId, setSectionId] = React.useState("");
  const [targetDate, setTargetDate] = React.useState("");
  const [currentValue, setCurrentValue] = React.useState<number>(0);
  const [targetValue, setTargetValue] = React.useState<number>(100);
  const [unit, setUnit] = React.useState("%");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setGoals(initialGoals);
  }, [initialGoals]);

  const openCreate = () => {
    setTitle("");
    setDescription("");
    setSectionId(sections[0]?.id || "");
    setTargetDate("");
    setCurrentValue(0);
    setTargetValue(100);
    setUnit("%");
    setIsCreateOpen(true);
  };

  const openEdit = (goal: GoalDTO) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || "");
    setSectionId(goal.sectionId || "");
    setTargetDate(goal.targetDate ? goal.targetDate.split("T")[0] : "");
    setCurrentValue(goal.currentValue);
    setTargetValue(goal.targetValue);
    setUnit(goal.unit);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingGoal) {
        await updateGoalAction(editingGoal.id, {
          title,
          description,
          sectionId: sectionId || null,
          targetDate: targetDate || null,
          currentValue: Number(currentValue),
          targetValue: Number(targetValue),
          unit,
        });
        setEditingGoal(null);
      } else {
        await createGoalAction({
          title,
          description,
          sectionId: sectionId || null,
          targetDate: targetDate || null,
          currentValue: Number(currentValue),
          targetValue: Number(targetValue),
          unit,
        });
        setIsCreateOpen(false);
      }
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-5 border-slate-200 dark:border-slate-800/80 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Active Targets & Milestones
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {goals.length} ongoing long-term goals
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/goals"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={openCreate}
            className="gap-1 text-xs h-7 px-2.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Target</span>
          </Button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {goals.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-8 text-center text-slate-400 dark:text-slate-500">
            <Target className="w-8 h-8 opacity-30 mb-2" />
            <p className="text-xs">No active goals yet. Set a target milestone! 🎯</p>
          </div>
        ) : (
          goals.map((goal) => {
            const isCompleted = goal.progressPercentage >= 100;

            return (
              <div
                key={goal.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-3 group shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {goal.section && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold"
                        style={{ color: goal.section.color || "#818cf8" }}
                      >
                        <Folder className="w-2.5 h-2.5" />
                        <span>{goal.section.name}</span>
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {goal.title}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEdit(goal)}
                    className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                    title="Edit goal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Bar & Numeric Indicator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </span>
                    <span
                      className={cn(
                        "font-extrabold",
                        isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"
                      )}
                    >
                      {goal.progressPercentage}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${goal.progressPercentage}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCompleted
                          ? "bg-emerald-500 dark:bg-emerald-400"
                          : "bg-gradient-to-r from-indigo-500 to-sky-400"
                      )}
                    />
                  </div>
                </div>

                {/* Days remaining badge */}
                {goal.daysRemaining !== null && goal.daysRemaining !== undefined && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {goal.daysRemaining > 0
                        ? `${goal.daysRemaining} days remaining`
                        : goal.daysRemaining === 0
                        ? "Due today"
                        : `${Math.abs(goal.daysRemaining)} days overdue`}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Goal Create/Edit Modal */}
      <Modal
        isOpen={isCreateOpen || !!editingGoal}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? "Edit Milestone Target" : "Create New Milestone Target"}
        description="Track measurable progress toward your quarterly, yearly, or personal goals."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Goal Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Solve 100 LeetCode Questions"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this goal matters, milestones, or notes..."
              rows={2}
              className="w-full rounded-xl glass-input px-3.5 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Section Domain</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full rounded-xl glass-input px-3.5 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="">None (General)</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Target Date (Optional)"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Current"
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(Number(e.target.value))}
              min={0}
              required
            />
            <Input
              label="Target"
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              min={1}
              required
            />
            <Input
              label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. %, books, km"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingGoal(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {editingGoal ? "Save Changes" : "Create Milestone"}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
