"use client";

import * as React from "react";
import {
  Sparkles,
  Zap,
  Flame,
  AlertTriangle,
  RotateCw,
  ArrowRight,
  Bot,
} from "lucide-react";
import { AIQuickInsightsDTO } from "@/types";

export function AiInsightsWidget() {
  const [insights, setInsights] = React.useState<AIQuickInsightsDTO | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const fetchInsights = React.useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/ai/insights");
      if (!res.ok) throw new Error("Failed to fetch insights");
      const json = await res.json();
      setInsights(json.data);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const openAiChat = (prompt?: string) => {
    window.dispatchEvent(
      new CustomEvent("open-ai-assistant", {
        detail: { prompt: prompt || "What should I prioritize right now?" },
      })
    );
  };

  if (error) {
    return null; // Gracefully hide widget if error occurs
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl p-5 glass-panel border border-slate-200 dark:border-slate-800/80 animate-pulse">
        <div className="flex items-center justify-between pb-3">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="space-y-2 mt-2">
          <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 glass-panel border border-indigo-200/50 dark:border-indigo-900/40 shadow-lg transition-all duration-300">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 rounded-full bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-transparent blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Greeting & AI Highlights */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{insights.greeting}! AI Progress Intelligence</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-normal">
                Live Analysis
              </span>
            </h3>
          </div>

          {/* Highlights List */}
          <div className="space-y-1 pt-1">
            {insights.highlights.map((highlight, idx) => (
              <p
                key={idx}
                className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-1.5"
              >
                <span>{highlight}</span>
              </p>
            ))}
          </div>

          {/* AI Recommendation Banner */}
          {insights.recommendation && (
            <div className="mt-2 text-xs px-3 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                <strong className="font-semibold">AI Recommendation:</strong>{" "}
                {insights.recommendation}
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Stats & Consult Button */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {insights.overdueTasksCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-3 h-3" />
                {insights.overdueTasksCount} Overdue
              </span>
            )}
            {insights.bestStreakDays && insights.bestStreakDays > 0 ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Flame className="w-3 h-3" />
                {insights.bestStreakDays}d Streak
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchInsights()}
              title="Refresh AI insights"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => openAiChat("Analyze my daily progress and tell me what to focus on next.")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
