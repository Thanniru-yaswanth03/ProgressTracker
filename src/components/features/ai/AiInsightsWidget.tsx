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
import { Card } from "@/components/ui/Card";

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
      <Card className="p-5 animate-pulse">
        <div className="flex items-center justify-between pb-3">
          <div className="h-4 w-40 bg-[var(--surface-sub)] rounded-md" />
          <div className="h-4 w-20 bg-[var(--surface-sub)] rounded-md" />
        </div>
        <div className="space-y-2 mt-2">
          <div className="h-3 w-3/4 bg-[var(--surface-sub)] rounded-md" />
          <div className="h-3 w-1/2 bg-[var(--surface-sub)] rounded-md" />
        </div>
      </Card>
    );
  }

  if (!insights) return null;

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6 transition-all duration-200">
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Greeting & AI Highlights */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
              <span>{insights.greeting}! AI Progress Intelligence</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft-border)] font-semibold">
                Live Analysis
              </span>
            </h3>
          </div>

          {/* Highlights List */}
          <div className="space-y-1 pt-1">
            {insights.highlights.map((highlight, idx) => (
              <p
                key={idx}
                className="text-xs sm:text-sm text-[var(--foreground)] leading-relaxed flex items-start gap-1.5 opacity-90"
              >
                <span>{highlight}</span>
              </p>
            ))}
          </div>

          {/* AI Recommendation Banner */}
          {insights.recommendation && (
            <div className="mt-2 text-xs px-3 py-2 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft-border)] text-[var(--foreground)] flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                <strong className="font-semibold text-[var(--primary)]">Recommendation:</strong>{" "}
                {insights.recommendation}
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Stats & Consult Button */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            {insights.overdueTasksCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-3 h-3" />
                {insights.overdueTasksCount} Overdue
              </span>
            )}
            {insights.bestStreakDays && insights.bestStreakDays > 0 ? (
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
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
              className="p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => openAiChat("Analyze my daily progress and tell me what to focus on next.")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
