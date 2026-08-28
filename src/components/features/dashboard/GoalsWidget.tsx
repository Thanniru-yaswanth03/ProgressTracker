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

import { useToast } from "@/components/providers/ToastProvider";

export interface GoalsWidgetProps {
  goals: GoalDTO[];
  sections: SectionDTO[];
}

export function GoalsWidget({ goals: initialGoals, sections }: GoalsWidgetProps) {
  const router = useRouter();
  const toast = useToast();
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
        const res = await updateGoalAction(editingGoal.id, {
          title,
          description,
          sectionId: sectionId || null,
          targetDate: targetDate || null,
          currentValue: Number(currentValue),
          targetValue: Number(targetValue),
          unit,
        });
        if (res.success) {
          toast.success("Milestone updated", `"${title}" saved.`);
          setEditingGoal(null);
        } else {
          toast.error("Failed to update milestone", res.error || "Please try again.");
        }
      } else {
        const res = await createGoalAction({
          title,
          description,
          sectionId: sectionId || null,
          targetDate: targetDate || null,
          currentValue: Number(currentValue),
          targetValue: Number(targetValue),
          unit,
        });
        if (res.success) {
          toast.success("Milestone target created", `"${title}" added.`);
          setIsCreateOpen(false);
        } else {
          toast.error("Failed to create milestone", res.error || "Please try again.");
        }
      }
      router.refresh();
    } catch {
      toast.error("An error occurred", "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] flex items-center justify-center text-[var(--primary)]">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">
              Active Targets & Milestones
            </h3>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              {goals.length} ongoing long-term goals
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/goals"
            className="text-xs font-semibold text-[var(--primary)] hover:underline transition-colors flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-[var(--surface-hover)]"
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
          <div className="col-span-full flex flex-col items-center justify-center py-8 text-center text-[var(--muted-foreground)]">
            <Target className="w-8 h-8 opacity-30 mb-2" />
            <p className="text-xs">No active goals yet. Set a target milestone! 🎯</p>
          </div>
        ) : (
          goals.map((goal) => {
            const isCompleted = goal.progressPercentage >= 100;

            return (
              <div
                key={goal.id}
                className="p-4 rounded-xl bg-[var(--surface-sub)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between space-y-3 group shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {goal.section && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold"
                        style={{ color: goal.section.color || "var(--primary)" }}
                      >
                        <Folder className="w-2.5 h-2.5" />
                        <span>{goal.section.name}</span>
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-[var(--foreground)] truncate">
                      {goal.title}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEdit(goal)}
                    className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                    title="Edit goal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Bar & Numeric Indicator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[var(--foreground)]">
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </span>
                    <span
                      className={cn(
                        "font-extrabold",
                        isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--primary)]"
                      )}
                    >
                      {goal.progressPercentage}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      style={{ width: `${goal.progressPercentage}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCompleted
                          ? "bg-emerald-500 dark:bg-emerald-400"
                          : "bg-[var(--primary)]"
                      )}
                    />
                  </div>
                </div>

                {/* Days remaining badge */}
                {goal.daysRemaining !== null && goal.daysRemaining !== undefined && (
                  <div className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                    <Clock className="w-3 h-3" />
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

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this goal matters, milestones, or notes..."
              rows={2}
              className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2 text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Section Domain
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] cursor-pointer"
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
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
