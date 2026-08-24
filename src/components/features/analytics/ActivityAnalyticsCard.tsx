"use client";

import * as React from "react";
import { ActivityStatsDTO } from "@/types";
import { Sparkles, Layers, Tag } from "lucide-react";

interface ActivityAnalyticsCardProps {
  activityStats: ActivityStatsDTO;
}

export function ActivityAnalyticsCard({
  activityStats,
}: ActivityAnalyticsCardProps) {
  const totalSectionFocus = activityStats.sectionBreakdown.reduce(
    (sum, s) => sum + s.focusMinutes,
    0
  );

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Time & Focus Allocation</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Activity & Deep Work Stats
          </h2>
        </div>

        <div className="flex items-baseline gap-1 text-right">
          <span className="text-2xl font-extrabold text-emerald-400">
            {Math.floor(activityStats.totalDurationMinutesAllTime / 60)}h{" "}
            {activityStats.totalDurationMinutesAllTime % 60}m
          </span>
          <span className="text-xs text-slate-500">total</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            All-Time Logs
          </span>
          <span className="text-xl font-bold text-white mt-0.5 block">
            {activityStats.totalActivitiesAllTime}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Past 30 Days
          </span>
          <span className="text-xl font-bold text-emerald-400 mt-0.5 block">
            {Math.floor(activityStats.totalDurationMinutesPast30Days / 60)}h{" "}
            {activityStats.totalDurationMinutesPast30Days % 60}m
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Avg Session
          </span>
          <span className="text-xl font-bold text-indigo-400 mt-0.5 block">
            {activityStats.averageSessionMinutes}m
          </span>
        </div>
      </div>

      {/* Section Distribution */}
      {activityStats.sectionBreakdown.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Time Invested by Section</span>
          </h4>

          <div className="space-y-2.5">
            {activityStats.sectionBreakdown.map((sec) => {
              const percent =
                totalSectionFocus > 0
                  ? Math.round((sec.focusMinutes / totalSectionFocus) * 100)
                  : 0;

              return (
                <div key={sec.sectionId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sec.color }}
                      />
                      <span className="font-bold text-white">{sec.sectionName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <span>
                        {Math.floor(sec.focusMinutes / 60)}h {sec.focusMinutes % 60}m
                      </span>
                      <span className="text-slate-500">({percent}%)</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: sec.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Tags Cloud */}
      {activityStats.topTags.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Top Focus Tags</span>
          </h4>

          <div className="flex flex-wrap gap-2">
            {activityStats.topTags.map((t) => (
              <div
                key={t.tag}
                className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-xs"
              >
                <span className="font-bold text-indigo-300">#{t.tag}</span>
                <span className="text-[10px] text-slate-400">
                  {Math.floor(t.focusMinutes / 60)}h {t.focusMinutes % 60}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
