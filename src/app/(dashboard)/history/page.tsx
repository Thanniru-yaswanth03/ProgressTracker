import * as React from "react";
import { requireUser } from "@/server/auth/session";
import { historyService } from "@/server/services/history.service";
import { HistoryView } from "@/components/features/history/HistoryView";
import { formatDateKey } from "@/server/services/streak.service";
import { Calendar } from "lucide-react";

export const metadata = {
  title: "History & Calendar — Progress Tracker",
  description: "Explore your chronological productivity timeline, daily heatmaps, and focus history.",
};

export default async function HistoryPage() {
  const user = await requireUser();

  const todayStr = formatDateKey(new Date());
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM

  const [monthData, dayHistory] = await Promise.all([
    historyService.getMonthHistory(user.id, currentMonthStr),
    historyService.getDayHistory(user.id, todayStr),
  ]);

  return (
    <div className="space-y-6 animate-enter-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Timeline & Consistency</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Activity History
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
            Inspect historical records, completed tasks, focus activities, and daily consistency scores.
          </p>
        </div>
      </div>

      {/* Main History View */}
      <HistoryView
        initialMonthData={monthData}
        initialDayHistory={dayHistory}
      />
    </div>
  );
}
