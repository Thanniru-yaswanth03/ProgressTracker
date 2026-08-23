import * as React from "react";
import { Metadata } from "next";
import { requireUser } from "@/server/auth/session";
import { historyService } from "@/server/services/history.service";
import { formatDateKey } from "@/server/services/streak.service";
import { HistoryView } from "@/components/features/history/HistoryView";

export const metadata: Metadata = {
  title: "Activity History & Calendar | Progress Tracker",
  description: "View historical progress, tasks completed, activities recorded, and daily completion scores.",
};

export default async function HistoryPage() {
  const user = await requireUser();
  const todayStr = formatDateKey(new Date());
  const monthStr = todayStr.slice(0, 7);

  const [monthData, todayHistory] = await Promise.all([
    historyService.getMonthHistory(user.id, monthStr),
    historyService.getDayHistory(user.id, todayStr),
  ]);

  return (
    <HistoryView
      initialMonthData={monthData}
      initialDayHistory={todayHistory}
    />
  );
}
