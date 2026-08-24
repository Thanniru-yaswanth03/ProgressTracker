"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Compass,
  Layers,
  CheckSquare,
  Flame,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

export interface QuickStartGuideProps {
  sectionsCount: number;
  tasksCount: number;
  habitsCount: number;
  goalsCount: number;
  activitiesCount: number;
}

export function QuickStartGuide({
  sectionsCount,
  tasksCount,
  habitsCount,
  goalsCount,
  activitiesCount,
}: QuickStartGuideProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    const dismissed = localStorage.getItem("progresstracker_guide_dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("progresstracker_guide_dismissed", "true");
  };

  const steps = [
    {
      id: "section",
      title: "Organize with a Section",
      description: "Create folders like 'Work', 'Health', or 'Study' to group your tasks and habits.",
      completed: sectionsCount > 0,
      href: "/sections",
      icon: Layers,
      color: "text-indigo-500 dark:text-indigo-400",
      actionText: "Create Section",
    },
    {
      id: "task",
      title: "Add your first Task",
      description: "Write down actionable to-dos with priorities (urgent, high) and due dates.",
      completed: tasksCount > 0,
      href: "/tasks",
      icon: CheckSquare,
      color: "text-sky-500 dark:text-sky-400",
      actionText: "Add Task",
    },
    {
      id: "habit",
      title: "Start a Daily Habit",
      description: "Pick a daily routine (e.g. read 20 mins, workout) and build consecutive streaks.",
      completed: habitsCount > 0,
      href: "/habits",
      icon: Flame,
      color: "text-amber-500 dark:text-amber-400",
      actionText: "Create Habit",
    },
    {
      id: "goal",
      title: "Set a Milestone Goal",
      description: "Define a quantifiable goal (e.g. Solve 50 Problems, Study 100 Hours) with stepper progress.",
      completed: goalsCount > 0,
      href: "/goals",
      icon: Target,
      color: "text-purple-500 dark:text-purple-400",
      actionText: "Set Goal",
    },
    {
      id: "analytics",
      title: "Explore Your Analytics",
      description: "Inspect completion rates, heatmaps, active days, and streak performance.",
      completed: activitiesCount > 0 || tasksCount > 0 || habitsCount > 0,
      href: "/analytics",
      icon: BarChart3,
      color: "text-pink-500 dark:text-pink-400",
      actionText: "View Analytics",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  if (isDismissed) {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => {
            setIsDismissed(false);
            localStorage.removeItem("progresstracker_guide_dismissed");
          }}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Show Quick-Start Guide</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl glass-panel border border-indigo-500/20 shadow-lg shadow-indigo-500/5 relative overflow-hidden transition-all duration-300">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Quick-Start & Guide
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {completedCount} of {steps.length} completed
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Follow these simple steps to set up your momentum workflow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isCollapsed ? "Expand Guide" : "Collapse Guide"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Dismiss Guide"
            title="Hide guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps List */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  step.completed
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/20"
                    : "bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 ${step.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">STEP {idx + 1}</span>
                    </div>

                    {step.completed ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Circle className="w-3.5 h-3.5" />
                        To Do
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {step.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <Link
                    href={step.href}
                    className={`text-xs font-semibold hover:underline inline-flex items-center gap-1 ${
                      step.completed
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-indigo-600 dark:text-indigo-400"
                    }`}
                  >
                    <span>{step.actionText}</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
