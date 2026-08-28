"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Flame, Plus } from "lucide-react";

export interface HabitEmptyStateProps {
  onCreate: () => void;
  filtered?: boolean;
}

export function HabitEmptyState({ onCreate, filtered = false }: HabitEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] my-4 shadow-card">
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
          <Flame className="w-7 h-7" />
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight mb-1">
        {filtered ? "No habits match your filter" : "No habits created yet"}
      </h3>
      <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-sm mb-6 leading-relaxed">
        {filtered
          ? "Try selecting a different domain section or clearing the search query to see your routines."
          : "Consistency builds momentum. Add your first daily or weekly habit routine now."}
      </p>

      <Button onClick={onCreate} size="md" className="gap-2">
        <Plus className="w-4 h-4" />
        <span>Create New Habit</span>
      </Button>
    </div>
  );
}
