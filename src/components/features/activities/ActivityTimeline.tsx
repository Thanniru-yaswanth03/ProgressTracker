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
import { FeatureGuideModal } from "@/components/ui/FeatureGuideModal";
import { Calendar, Plus, Search } from "lucide-react";

export interface ActivityTimelineProps {
  initialActivities: ActivityDTO[];
  sections: SectionDTO[];
  defaultSectionId?: string | null;
  hideStats?: boolean;
}

export function ActivityTimeline({
  initialActivities,
  sections,
  defaultSectionId,
  hideStats = false,
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
      let label = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      if (dateObj.toDateString() === todayStr) {
        label = `Today, ${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      } else if (dateObj.toDateString() === yesterdayStr) {
        label = `Yesterday, ${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      }

      groups.push({
        label,
        date: key,
        items: groupMap.get(key)!,
      });
    });

    return groups;
  }, [filteredActivities]);

  const handleEdit = (activity: ActivityDTO) => {
    setEditingActivity(activity);
  };

  const handleDelete = (activity: ActivityDTO) => {
    setDeletingActivity(activity);
  };

  const handleMutationSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Aggregate Stats Summary */}
      {!hideStats && <ActivityStatsBanner activities={activities} />}

      {/* Control Bar: Search, Section & Tag Filter, How-To Guide, Log Activity Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search activities or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] pl-10 pr-4 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)]"
          />
        </div>

        {/* Dropdowns & Log Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Section Filter Dropdown */}
          {!defaultSectionId && sections.length > 0 && (
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-xl bg-[var(--input)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] cursor-pointer"
            >
              <option value="all">All Sections</option>
              <option value="none">General (No Section)</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Tag Filter Dropdown */}
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded-xl bg-[var(--input)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] cursor-pointer"
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          )}

          {/* Activity How-To Guide */}
          <FeatureGuideModal
            featureName="Activities"
            title="How Activities & Focus Logging Work"
            subtitle="Track focused sessions, deep work, and celebrate automated accomplishments."
            steps={[
              {
                title: "Log Manual Focus Sessions",
                description: "Record deep work blocks, coding sprints, reading, or workout sessions with duration in minutes.",
                example: "Title: Algorithmic Problem Solving | Duration: 45 mins | Tags: #dsa, #leetcode",
              },
              {
                title: "Automated Task Sync",
                description: "When you complete a task on your tasks board, Progress Tracker automatically logs an activity entry here!",
              },
              {
                title: "Tag Clouds & Filtering",
                description: "Use tags like #deepwork, #writing, or #fitness to aggregate your time spent across specific disciplines in analytics.",
              },
              {
                title: "Calendar & Focus Analytics",
                description: "Every recorded minute flows into your daily focus totals and weekly productivity velocity charts.",
              },
            ]}
            tip="Logging activity duration helps you see exact focus time breakdowns across your 7-day and 30-day analytics charts."
          />

          {/* Log Activity Button */}
          <Button
            onClick={() => setIsLogOpen(true)}
            size="md"
            className="gap-2 shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Log Activity</span>
          </Button>
        </div>
      </div>

      {/* Activities Timeline Groups / Empty State */}
      {filteredActivities.length === 0 ? (
        <ActivityEmptyState
          filtered={sectionFilter !== "all" || tagFilter !== "all" || searchQuery.trim().length > 0}
          onLog={() => setIsLogOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          {groupedActivities.map((group) => (
            <div key={group.date} className="space-y-3">
              {/* Day Header Marker */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--foreground)] shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{group.label}</span>
                </div>
                <div className="h-[1px] flex-1 bg-[var(--border-subtle)]" />
                <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                  {group.items.length} {group.items.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              {/* Day Activities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        onSuccess={(savedActivity) => {
          setIsLogOpen(false);
          setActivities((prev) => [savedActivity, ...prev.filter((a) => a.id !== savedActivity.id)]);
          handleMutationSuccess();
        }}
      />

      {/* Edit Activity Modal */}
      <ActivityModal
        isOpen={!!editingActivity}
        onClose={() => setEditingActivity(null)}
        activity={editingActivity}
        sections={sections}
        onSuccess={(savedActivity) => {
          setEditingActivity(null);
          setActivities((prev) => prev.map((a) => (a.id === savedActivity.id ? savedActivity : a)));
          handleMutationSuccess();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteActivityDialog
        isOpen={!!deletingActivity}
        activity={deletingActivity}
        onClose={() => setDeletingActivity(null)}
        onSuccess={(deletedActivityId) => {
          const idToRemove = deletedActivityId || deletingActivity?.id;
          if (idToRemove) {
            setActivities((prev) => prev.filter((a) => a.id !== idToRemove));
          }
          setDeletingActivity(null);
          handleMutationSuccess();
        }}
      />
    </div>
  );
}
