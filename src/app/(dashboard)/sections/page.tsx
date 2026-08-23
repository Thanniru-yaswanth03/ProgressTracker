import * as React from "react";
import { requireUser } from "@/server/auth/session";
import { sectionService } from "@/server/services/section.service";
import { SectionList } from "@/components/features/sections/SectionList";
import { Layers } from "lucide-react";

export const metadata = {
  title: "Sections — Progress Tracker",
  description: "Organize your life domains, tasks, and habits with custom sections.",
};

export default async function SectionsPage() {
  const user = await requireUser();
  const sections = await sectionService.getSections(user.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Categorization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Life & Focus Sections
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create and customize domains to categorize and filter your upcoming tasks, habits, and goals.
          </p>
        </div>
      </div>

      {/* Main Section Content List */}
      <SectionList initialSections={sections} />
    </div>
  );
}
