"use client";

import * as React from "react";
import { ActivityDTO } from "@/types";
import { Card } from "@/components/ui/Card";
import { Clock, Flame, Sparkles, Tag } from "lucide-react";

export interface ActivityStatsBannerProps {
  activities: ActivityDTO[];
}

export function ActivityStatsBanner({ activities }: ActivityStatsBannerProps) {
  const totalCount = activities.length;

  const totalMinutes = activities.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remMinutes = totalMinutes % 60;
  const timeFormatted =
    totalHours > 0
      ? `${totalHours}h ${remMinutes > 0 ? `${remMinutes}m` : ""}`
      : `${remMinutes}m`;

  const tagSet = new Set<string>();
  activities.forEach((a) => a.tags?.forEach((t) => tagSet.add(t)));

  const sectionSet = new Set<string>();
  activities.forEach((a) => {
    if (a.sectionId) sectionSet.add(a.sectionId);
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Activities */}
      <Card className="p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Accomplishments
          </div>
          <div className="text-xl font-extrabold text-[var(--foreground)] mt-0.5">{totalCount}</div>
        </div>
      </Card>

      {/* Total Time Logged */}
      <Card className="p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Time Logged
          </div>
          <div className="text-xl font-extrabold text-[var(--foreground)] mt-0.5">{timeFormatted}</div>
        </div>
      </Card>

      {/* Active Sections */}
      <Card className="p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] flex items-center justify-center text-[var(--primary)] shrink-0">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Active Domains
          </div>
          <div className="text-xl font-extrabold text-[var(--primary)] mt-0.5">
            {sectionSet.size}
          </div>
        </div>
      </Card>

      {/* Unique Tags */}
      <Card className="p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          <Tag className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Tracked Tags
          </div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
            {tagSet.size}
          </div>
        </div>
      </Card>
    </div>
  );
}
