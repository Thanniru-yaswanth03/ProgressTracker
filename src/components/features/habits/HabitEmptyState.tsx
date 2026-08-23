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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl glass-panel border border-slate-800/80 my-4">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
          <Flame className="w-8 h-8" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md">
          +
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-100 tracking-tight mb-1.5">
        {filtered ? "No habits match your filters" : "No active habit routines yet"}
      </h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
        {filtered
          ? "Try adjusting your search query or domain filter to see more habits."
          : "Create recurring habits, check them off daily or on target days, and build long-term momentum streaks."}
      </p>

      <Button onClick={onCreate} size="md" className="gap-2 bg-amber-600 hover:bg-amber-500 text-white">
        <Plus className="w-4 h-4" />
        <span>Create First Habit</span>
      </Button>
    </div>
  );
}
