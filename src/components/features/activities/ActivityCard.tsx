"use client";

import * as React from "react";
import { ActivityDTO } from "@/types";
import { Card } from "@/components/ui/Card";
import {
  CheckCircle2,
  Clock,
  Edit2,
  Flame,
  Folder,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityCardProps {
  activity: ActivityDTO;
  onEdit: (activity: ActivityDTO) => void;
  onDelete: (activity: ActivityDTO) => void;
}

export function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  const dateObj = new Date(activity.occurredAt);

  // Time format e.g. "3:45 PM"
  const formattedTime = dateObj.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const formattedDuration = (mins?: number) => {
    if (!mins || mins <= 0) return null;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0 && remainingMins > 0) return `${hours}h ${remainingMins}m`;
    if (hours > 0) return `${hours}h`;
    return `${remainingMins}m`;
  };

  const durationStr = formattedDuration(activity.duration);

  const typeDetails = {
    manual_entry: {
      label: "Accomplishment",
      icon: Sparkles,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      nodeBg: "bg-emerald-500 shadow-emerald-500/50",
    },
    task_completed: {
      label: "Task Done",
      icon: CheckCircle2,
      color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      nodeBg: "bg-sky-500 shadow-sky-500/50",
    },
    habit_completed: {
      label: "Habit Logged",
      icon: Flame,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      nodeBg: "bg-amber-500 shadow-amber-500/50",
    },
  }[activity.type] || {
    label: "Activity",
    icon: Sparkles,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    nodeBg: "bg-indigo-500 shadow-indigo-500/50",
  };

  const Icon = typeDetails.icon;

  return (
    <div className="relative pl-6 sm:pl-8 group">
      {/* Glowing Timeline Node Marker */}
      <div
        className={cn(
          "absolute left-0 top-3.5 w-3 h-3 rounded-full border-2 border-slate-950 shadow-md transition-transform group-hover:scale-125",
          typeDetails.nodeBg
        )}
      />

      <Card className="p-4 border-slate-800/80 hover:border-slate-700/80 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          {/* Title and Summary */}
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                  typeDetails.color
                )}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{typeDetails.label}</span>
              </span>

              <span className="text-xs text-slate-400 font-medium">
                {formattedTime}
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-100 tracking-tight leading-snug">
              {activity.title}
            </h4>

            {activity.description && (
              <p className="text-xs text-slate-400 leading-relaxed pt-0.5">
                {activity.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0 self-end sm:self-start">
            <button
              type="button"
              onClick={() => onEdit(activity)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Edit activity"
              aria-label={`Edit ${activity.title}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(activity)}
              className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Delete activity"
              aria-label={`Delete ${activity.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Metadata Footer: Duration, Section, and Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/60">
          {durationStr && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Clock className="w-2.5 h-2.5" />
              <span>{durationStr}</span>
            </span>
          )}

          {activity.section && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
              style={{
                color: activity.section.color || "#6366f1",
                backgroundColor: `${activity.section.color || "#6366f1"}15`,
                borderColor: `${activity.section.color || "#6366f1"}30`,
              }}
            >
              <Folder className="w-2.5 h-2.5" />
              <span className="truncate max-w-[120px]">{activity.section.name}</span>
            </span>
          )}

          {activity.tags && activity.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {activity.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-900 border border-slate-800"
                >
                  <Tag className="w-2 h-2 text-indigo-400" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
