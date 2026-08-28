"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SectionDTO } from "@/types";
import { SectionCard } from "./SectionCard";
import { SectionModal } from "./SectionModal";
import { DeleteSectionDialog } from "./DeleteSectionDialog";
import { SectionEmptyState } from "./SectionEmptyState";
import { Button } from "@/components/ui/Button";
import { FeatureGuideModal } from "@/components/ui/FeatureGuideModal";
import { FolderPlus, Search } from "lucide-react";

export interface SectionListProps {
  initialSections: SectionDTO[];
}

export function SectionList({ initialSections }: SectionListProps) {
  const router = useRouter();
  const [sections, setSections] = React.useState<SectionDTO[]>(initialSections);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState<SectionDTO | null>(null);
  const [deletingSection, setDeletingSection] = React.useState<SectionDTO | null>(null);

  // Sync with server state changes
  React.useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  const filteredSections = React.useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase().trim();
    return sections.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
    );
  }, [sections, searchQuery]);

  const handleEdit = (section: SectionDTO) => {
    setEditingSection(section);
  };

  const handleDelete = (section: SectionDTO) => {
    setDeletingSection(section);
  };

  const handleMutationSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-[var(--input)] border border-[var(--border)] pl-10 pr-4 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)] focus:ring-3 focus:ring-[var(--primary-soft)]"
          />
        </div>

        {/* Action Controls: Guide & Create Button */}
        <div className="flex items-center gap-3">
          <FeatureGuideModal
            featureName="Sections"
            title="How Sections Work"
            subtitle="Categorize your tasks, habits, and focus logs into organized project workspaces."
            steps={[
              {
                title: "Create Categories for Life Domains",
                description: "Group your priorities into areas like 'Software Engineering', 'Fitness & Health', or 'Personal Growth'.",
                example: "Work Projects, Academic Research, Marathon Prep",
              },
              {
                title: "Custom Accent Colors",
                description: "Assign unique colors to each section to easily spot related tasks across your dashboard and calendar.",
              },
              {
                title: "Dedicated Section Drill-Downs",
                description: "Click any section card to view its dedicated hub showing only tasks, habits, and focus time for that project.",
              },
              {
                title: "Safe Deletion",
                description: "Deleting a section preserves all underlying tasks and habits by safely reassigning them to 'General'.",
              },
            ]}
            tip="Create 3-5 high-level sections for maximum clarity without overcomplicating your workflow."
          />

          <Button
            onClick={() => setIsCreateOpen(true)}
            size="md"
            className="gap-2 shrink-0 shadow-xs"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Section</span>
          </Button>
        </div>
      </div>

      {/* Grid or Empty State */}
      {sections.length === 0 ? (
        <SectionEmptyState onCreate={() => setIsCreateOpen(true)} />
      ) : filteredSections.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
            No sections match &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Section Modal */}
      <SectionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          handleMutationSuccess();
        }}
      />

      {/* Edit Section Modal */}
      <SectionModal
        isOpen={!!editingSection}
        onClose={() => setEditingSection(null)}
        section={editingSection}
        onSuccess={() => {
          setEditingSection(null);
          handleMutationSuccess();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteSectionDialog
        isOpen={!!deletingSection}
        section={deletingSection}
        onClose={() => setDeletingSection(null)}
        onSuccess={() => {
          setDeletingSection(null);
          handleMutationSuccess();
        }}
      />
    </div>
  );
}
