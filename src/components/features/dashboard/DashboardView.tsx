"use client";

import * as React from "react";
import { DashboardDataDTO, SectionDTO } from "@/types";
import { DashboardHero } from "./DashboardHero";
import { QuickStartGuide } from "./QuickStartGuide";
import { WeeklyActivityChart } from "./WeeklyActivityChart";
import { TodayTasksWidget } from "./TodayTasksWidget";
import { TodayHabitsWidget } from "./TodayHabitsWidget";
import { GoalsWidget } from "./GoalsWidget";
import { ActivityTimeline } from "@/components/features/activities/ActivityTimeline";
import { Sparkles } from "lucide-react";

export interface DashboardViewProps {
  userName: string;
  data: DashboardDataDTO;
  sections: SectionDTO[];
}

export function DashboardView({ userName, data, sections }: DashboardViewProps) {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Hero Welcome & Daily Completion Gauge */}
      <DashboardHero userName={userName} data={data} />

      {/* 2. Interactive Quick-Start & Guidance Guide */}
      <QuickStartGuide
        sectionsCount={sections.length}
        tasksCount={data.todayTasks.length}
        habitsCount={data.activeHabits.length}
        goalsCount={data.goals.length}
        activitiesCount={data.recentActivities.length}
      />

      {/* 3. 7-Day Weekly Activity & Focus Chart */}
      <WeeklyActivityChart metrics={data.weeklyMetrics} />

      {/* 4. Today's Tasks and Today's Habits Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTasksWidget tasks={data.todayTasks} sections={sections} />
        <TodayHabitsWidget habits={data.activeHabits} sections={sections} />
      </div>

      {/* 5. Goals & Long-Term Targets */}
      <GoalsWidget goals={data.goals} sections={sections} />

      {/* 6. Recent Activity Feed */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
          <Sparkles className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Recent Activity Feed
          </h2>
        </div>

        <ActivityTimeline
          initialActivities={data.recentActivities}
          sections={sections}
          hideStats
        />
      </div>
    </div>
  );
}
