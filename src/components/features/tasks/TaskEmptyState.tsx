"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { CheckSquare, Plus } from "lucide-react";

export interface TaskEmptyStateProps {
  onCreate: () => void;
  filtered?: boolean;
}

export function TaskEmptyState({ onCreate, filtered = false }: TaskEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] my-4 shadow-card">
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] flex items-center justify-center text-[var(--primary)] shadow-xs">
          <CheckSquare className="w-7 h-7" />
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight mb-1">
        {filtered ? "No tasks match your filters" : "No tasks created yet"}
      </h3>
      <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-sm mb-6 leading-relaxed">
        {filtered
          ? "Try adjusting your search query, priority, or section filters to see more tasks."
          : "Add your action items, prioritize them, and track your daily accomplishments."}
      </p>

      <Button onClick={onCreate} size="md" className="gap-2">
        <Plus className="w-4 h-4" />
        <span>Create New Task</span>
      </Button>
    </div>
  );
}
