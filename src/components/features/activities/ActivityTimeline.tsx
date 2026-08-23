"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ActivityDTO, SectionDTO } from "@/types";
import { ActivityCard } from "./ActivityCard";
import { ActivityModal } from "./ActivityModal";
import { DeleteActivityDialog } from "./DeleteActivityDialog";
import { ActivityEmptyState } from "./ActivityEmptyState";
import { ActivityStatsBanner } from "./ActivityStatsBanner";
import { Button } from "@/components/ui/Button";
import { Calendar, Filter, Plus, Search, Sparkles, Tag } from "lucide-react";

export interface ActivityTimelineProps {
  initialActivities: ActivityDTO[];
  sections: SectionDTO[];
  defaultSectionId?: string | null;
  hideStats?: boolean;
  compact?: boolean;
}

export function ActivityTimeline({
  initialActivities,
  sections,
  defaultSectionId,
  hideStats = false,
  compact = false,
}: ActivityTimelineProps) {
  const router = useRouter();
  const [activities, setActivities] = React.useState<ActivityDTO[]>(initialActivities);

  // Filters
  const [sectionFilter, setSectionFilter] = React.useState<string>(defaultSectionId || "all");
  const [tagFilter, setTagFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modals
  const [isLogOpen, setIsLogOpen] = React.useState(false);
  const [editingActivity, setEditingActivity] = React.useState<ActivityDTO | null>(null);
  const [deletingActivity, setDeletingActivity] = React.useState<ActivityDTO | null>(null);

  React.useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

  // Extract all unique tags across activities for tag dropdown
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    activities.forEach((a) => a.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [activities]);

  const filteredActivities = React.useMemo(() => {
    return activities.filter((act) => {
      // Section filter
      if (sectionFilter !== "all") {
        if (sectionFilter === "none" && act.sectionId) return false;
        if (sectionFilter !== "none" && act.sectionId !== sectionFilter) return false;
      }

      // Tag filter
      if (tagFilter !== "all" && !act.tags?.includes(tagFilter)) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = act.title.toLowerCase().includes(query);
        const matchDesc = act.description?.toLowerCase().includes(query);
        const matchSection = act.section?.name.toLowerCase().includes(query);
        const matchTag = act.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchSection && !matchTag) return false;
      }

      return true;
    });
  }, [activities, sectionFilter, tagFilter, searchQuery]);

  // Group activities chronologically by day
  const groupedActivities = React.useMemo(() => {
    const groups: { label: string; date: string; items: ActivityDTO[] }[] = [];
    const groupMap = new Map<string, ActivityDTO[]>();

    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    filteredActivities.forEach((act) => {
      const actDate = new Date(act.occurredAt);
      const dateKey = actDate.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!groupMap.has(dateKey)) {
        groupMap.set(dateKey, []);
      }
      groupMap.get(dateKey)!.push(act);
    });

    // Sort group keys descending
    const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a));

    sortedKeys.forEach((key) => {
      const dateObj = new Date(`${key}T00:00:00`);
      let label = dateObj.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      if (dateObj.toDateString() === todayStr) {
        label = "Today";
      } else if (dateObj.toDateString() === yesterdayStr) {
        label = "Yesterday";
      }

      groups.push({
        label,
        date: key,
        items: groupMap.get(key)!,
      });
    });

    return groups;
  }, [filteredActivities]);

  const handleEdit = (act: ActivityDTO) => {
    setEditingActivity(act);
  };

  const handleDelete = (act: ActivityDTO) => {
    setDeletingActivity(act);
  };

  const handleMutationSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {!hideStats && <ActivityStatsBanner activities={activities} />}

      {/* Control Bar: Filters, Search & Log Activity Trigger */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Timeline</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 text-[10px]">
              {activities.length}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[160px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl glass-input pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Section Filter (if not inside single section view) */}
          {!defaultSectionId && sections.length > 0 && (
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-xl glass-input px-3 py-1.5 text-xs text-slate-200 bg-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="all">All Domains</option>
              <option value="none">General</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded-xl glass-input px-3 py-1.5 text-xs text-slate-200 bg-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          )}

          {/* Log Activity Button */}
          <Button
            onClick={() => setIsLogOpen(true)}
            size="sm"
            className="gap-1.5 shrink-0 shadow-md shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Activity</span>
          </Button>
        </div>
      </div>

      {/* Chronological Timeline Container */}
      {activities.length === 0 ? (
        <ActivityEmptyState onLog={() => setIsLogOpen(true)} />
      ) : groupedActivities.length === 0 ? (
        <ActivityEmptyState onLog={() => setIsLogOpen(true)} filtered />
      ) : (
        <div className="relative pl-2 sm:pl-4 space-y-8 before:absolute before:left-3.5 sm:before:left-5.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800/80">
          {groupedActivities.map((group) => (
            <div key={group.date} className="relative space-y-3">
              {/* Date Header Tag */}
              <div className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-850 text-xs font-bold text-slate-300 shadow-md">
                <Calendar className="w-3 h-3 text-indigo-400" />
                <span>{group.label}</span>
                <span className="text-[10px] text-slate-500 font-normal ml-1">
                  ({group.items.length})
                </span>
              </div>

              {/* Day's Activities */}
              <div className="space-y-3 pt-1">
                {group.items.map((act) => (
                  <ActivityCard
                    key={act.id}
                    activity={act}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Activity Modal */}
      <ActivityModal
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        sections={sections}
        defaultSectionId={defaultSectionId}
        onSuccess={handleMutationSuccess}
      />

      {/* Edit Activity Modal */}
      <ActivityModal
        isOpen={!!editingActivity}
        activity={editingActivity}
        sections={sections}
        onClose={() => setEditingActivity(null)}
        onSuccess={handleMutationSuccess}
      />

      {/* Delete Dialog */}
      <DeleteActivityDialog
        isOpen={!!deletingActivity}
        activity={deletingActivity}
        onClose={() => setDeletingActivity(null)}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
}
