"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { FolderPlus, Layers } from "lucide-react";

export interface SectionEmptyStateProps {
  onCreate: () => void;
}

export function SectionEmptyState({ onCreate }: SectionEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] my-4">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] flex items-center justify-center text-[var(--primary)] shadow-xs">
          <Layers className="w-8 h-8" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold shadow-xs">
          +
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight mb-1.5">
        No sections created yet
      </h3>
      <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-sm mb-6 leading-relaxed">
        Sections represent high-level domains in your life (like Fitness, Work, or Reading). Create your first section to organize future tasks and habits.
      </p>

      <Button onClick={onCreate} size="md" className="gap-2">
        <FolderPlus className="w-4 h-4" />
        <span>Create Your First Section</span>
      </Button>
    </div>
  );
}
