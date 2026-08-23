"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SectionDTO } from "@/types";
import { SectionCard } from "./SectionCard";
import { SectionModal } from "./SectionModal";
import { DeleteSectionDialog } from "./DeleteSectionDialog";
import { SectionEmptyState } from "./SectionEmptyState";
import { Button } from "@/components/ui/Button";
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl glass-input pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Create Button */}
        <Button
          onClick={() => setIsCreateOpen(true)}
          size="md"
          className="gap-2 shrink-0 shadow-lg shadow-indigo-500/20"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Section</span>
        </Button>
      </div>

      {/* Grid or Empty State */}
      {sections.length === 0 ? (
        <SectionEmptyState onCreate={() => setIsCreateOpen(true)} />
      ) : filteredSections.length === 0 ? (
        <div className="text-center py-12 rounded-2xl glass-panel border border-slate-800/80">
          <p className="text-sm text-slate-400">
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

      {/* Create Modal */}
      <SectionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleMutationSuccess}
      />

      {/* Edit / Rename Modal */}
      <SectionModal
        isOpen={!!editingSection}
        section={editingSection}
        onClose={() => setEditingSection(null)}
        onSuccess={handleMutationSuccess}
      />

      {/* Delete Dialog */}
      <DeleteSectionDialog
        isOpen={!!deletingSection}
        section={deletingSection}
        onClose={() => setDeletingSection(null)}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
}
