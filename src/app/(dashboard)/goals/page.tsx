import * as React from "react";
import { Metadata } from "next";
import { requireUser } from "@/server/auth/session";
import { goalService } from "@/server/services/goal.service";
import { sectionService } from "@/server/services/section.service";
import { GoalsView } from "@/components/features/goals/GoalsView";

export const metadata: Metadata = {
  title: "Goals & Milestones | Progress Tracker",
  description: "Track quantifiable milestones, target dates, and progress counters.",
};

export default async function GoalsPage() {
  const user = await requireUser();

  const [goals, sections] = await Promise.all([
    goalService.getGoals(user.id),
    sectionService.getSections(user.id),
  ]);

  return <GoalsView initialGoals={goals} sections={sections} />;
}
