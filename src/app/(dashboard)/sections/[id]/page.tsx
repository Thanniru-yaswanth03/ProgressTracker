import * as React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { sectionService } from "@/server/services/section.service";
import { taskService } from "@/server/services/task.service";
import { habitService } from "@/server/services/habit.service";
import { activityService } from "@/server/services/activity.service";
import { SectionDetailView } from "@/components/features/sections/SectionDetailView";

export interface SectionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: SectionPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const section = await sectionService.getSectionById(id, user.id);

  if (!section) {
    return {
      title: "Section Not Found — Progress Tracker",
    };
  }

  return {
    title: `${section.name} — Progress Tracker`,
    description: section.description || `View tasks, habits, and completed activities in ${section.name}`,
  };
}

export default async function SectionDetailPage({ params }: SectionPageProps) {
  const user = await requireUser();
  const { id } = await params;

  const [section, tasks, habits, activities, sections] = await Promise.all([
    sectionService.getSectionById(id, user.id),
    taskService.getTasks(user.id, { sectionId: id }),
    habitService.getHabits(user.id, { sectionId: id }),
    activityService.getActivities(user.id, { sectionId: id }),
    sectionService.getSections(user.id),
  ]);

  if (!section) {
    notFound();
  }

  return (
    <SectionDetailView
      section={section}
      tasks={tasks}
      habits={habits}
      activities={activities}
      allSections={sections}
    />
  );
}
