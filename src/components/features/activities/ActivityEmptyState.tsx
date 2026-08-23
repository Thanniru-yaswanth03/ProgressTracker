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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl glass-panel border border-slate-800/80 my-4">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center text-white text-xs shadow-md">
          +
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-100 tracking-tight mb-1.5">
        {filtered ? "No activities found" : "No completed activities recorded yet"}
      </h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
        {filtered
          ? "Try adjusting your search query, section filter, or tag selection to see more activity history."
          : "Log completed deep-work sessions, workouts, reading blocks, or finished milestones to build your timeline."}
      </p>

      <Button onClick={onLog} size="md" className="gap-2">
        <Plus className="w-4 h-4" />
        <span>Log Completed Activity</span>
      </Button>
    </div>
  );
}
