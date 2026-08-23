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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl glass-panel border border-slate-800/80 my-4">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10">
          <CheckSquare className="w-8 h-8" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white text-xs shadow-md">
          +
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-100 tracking-tight mb-1.5">
        {filtered ? "No tasks match your filters" : "No tasks created yet"}
      </h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
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
