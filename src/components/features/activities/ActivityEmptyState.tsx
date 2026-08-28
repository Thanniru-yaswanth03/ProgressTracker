"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Plus, Sparkles } from "lucide-react";

export interface ActivityEmptyStateProps {
  onLog: () => void;
  filtered?: boolean;
}

export function ActivityEmptyState({ onLog, filtered = false }: ActivityEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] my-4 shadow-card">
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
          <Sparkles className="w-7 h-7" />
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight mb-1">
        {filtered ? "No activities match your filters" : "No activities recorded yet"}
      </h3>
      <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-sm mb-6 leading-relaxed">
        {filtered
          ? "Try clearing your tag or section filters to see more recorded momentum items."
          : "Log deep work sessions, study time, or tasks completed to capture your daily accomplishments."}
      </p>

      <Button onClick={onLog} size="md" className="gap-2">
        <Plus className="w-4 h-4" />
        <span>Log First Activity</span>
      </Button>
    </div>
  );
}
