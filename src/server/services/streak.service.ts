import { HabitDayStatus, HabitFrequency, StreakInfo } from "@/types";

/**
 * Pure date utility to convert Date object to YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Adds or subtracts days from a YYYY-MM-DD date string
 */
export function shiftDate(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

/**
 * Gets day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) for a YYYY-MM-DD date string
 */
export function getDayOfWeek(dateStr: string): number {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.getDay();
}

/**
 * Pure deterministic calculation of habit streaks based solely on HabitLog date records.
 *
 * Handles:
 * - Consecutive days
 * - Missed days
 * - Today vs Yesterday active grace period
 * - Future dates filtering
 * - Deduplication
 * - Weekly scheduled target days
 */
export function calculateHabitStreak(
  logDates: string[],
  options?: {
    today?: string;
    frequency?: HabitFrequency;
    targetDays?: number[];
  }
): StreakInfo {
  const todayStr = options?.today || formatDateKey(new Date());
  const frequency = options?.frequency || "daily";
  const targetDays = options?.targetDays && options.targetDays.length > 0
    ? options.targetDays
    : [0, 1, 2, 3, 4, 5, 6];

  // Filter out any future dates and deduplicate
  const validDates = Array.from(
    new Set(
      logDates
        .filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
        .filter((d) => d <= todayStr)
    )
  ).sort();

  const totalCompletions = validDates.length;
  const isCompletedToday = validDates.includes(todayStr);

  if (totalCompletions === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isCompletedToday: false,
      totalCompletions: 0,
      completionRate: 0,
    };
  }

  const dateSet = new Set(validDates);

  // --- 1. Longest Streak Calculation (Lifetime) ---
  let longestStreak = 0;
  if (frequency === "daily") {
    let currentRun = 0;
    let prevDateStr: string | null = null;

    for (const d of validDates) {
      if (prevDateStr === null) {
        currentRun = 1;
      } else {
        const expectedNext = shiftDate(prevDateStr, 1);
        if (d === expectedNext) {
          currentRun += 1;
        } else {
          currentRun = 1;
        }
      }
      if (currentRun > longestStreak) {
        longestStreak = currentRun;
      }
      prevDateStr = d;
    }
  } else {
    // Weekly target days longest streak
    let currentRun = 0;
    let prevTargetDate: string | null = null;

    for (const d of validDates) {
      const dayOfWeek = getDayOfWeek(d);
      if (!targetDays.includes(dayOfWeek)) continue;

      if (prevTargetDate === null) {
        currentRun = 1;
      } else {
        // Find if d is the immediate next target day after prevTargetDate
        let cursor = shiftDate(prevTargetDate, 1);
        let wasNextScheduledDay = false;
        while (cursor <= d) {
          if (targetDays.includes(getDayOfWeek(cursor))) {
            if (cursor === d) wasNextScheduledDay = true;
            break;
          }
          cursor = shiftDate(cursor, 1);
        }

        if (wasNextScheduledDay) {
          currentRun += 1;
        } else {
          currentRun = 1;
        }
      }
      if (currentRun > longestStreak) {
        longestStreak = currentRun;
      }
      prevTargetDate = d;
    }
  }

  // --- 2. Current Streak Calculation ---
  let currentStreak = 0;

  if (frequency === "daily") {
    const yesterdayStr = shiftDate(todayStr, -1);

    if (dateSet.has(todayStr)) {
      // Completed today -> count back from today
      currentStreak = 1;
      let cursor = shiftDate(todayStr, -1);
      while (dateSet.has(cursor)) {
        currentStreak += 1;
        cursor = shiftDate(cursor, -1);
      }
    } else if (dateSet.has(yesterdayStr)) {
      // Not completed today, but done yesterday -> active streak grace period
      currentStreak = 1;
      let cursor = shiftDate(yesterdayStr, -1);
      while (dateSet.has(cursor)) {
        currentStreak += 1;
        cursor = shiftDate(cursor, -1);
      }
    } else {
      // Missed yesterday and not done today -> streak broken
      currentStreak = 0;
    }
  } else {
    // Weekly frequency
    const isTodayTarget = targetDays.includes(getDayOfWeek(todayStr));

    if (isTodayTarget && dateSet.has(todayStr)) {
      currentStreak = 1;
      let cursor = shiftDate(todayStr, -1);
      while (true) {
        // Find previous scheduled day
        while (!targetDays.includes(getDayOfWeek(cursor))) {
          cursor = shiftDate(cursor, -1);
        }
        if (dateSet.has(cursor)) {
          currentStreak += 1;
          cursor = shiftDate(cursor, -1);
        } else {
          break;
        }
      }
    } else {
      // Find the most recent scheduled target day prior to today
      let lastScheduledDay = shiftDate(todayStr, isTodayTarget ? 0 : -1);
      if (isTodayTarget) {
        // Since today is not completed, check the target day before today
        lastScheduledDay = shiftDate(todayStr, -1);
      }
      while (!targetDays.includes(getDayOfWeek(lastScheduledDay))) {
        lastScheduledDay = shiftDate(lastScheduledDay, -1);
      }

      if (dateSet.has(lastScheduledDay)) {
        // Active streak grace period for weekly target
        currentStreak = 1;
        let cursor = shiftDate(lastScheduledDay, -1);
        while (true) {
          while (!targetDays.includes(getDayOfWeek(cursor))) {
            cursor = shiftDate(cursor, -1);
          }
          if (dateSet.has(cursor)) {
            currentStreak += 1;
            cursor = shiftDate(cursor, -1);
          } else {
            break;
          }
        }
      } else {
        currentStreak = 0;
      }
    }
  }

  // Calculate 30-day completion rate
  let targetDaysInPast30 = 0;
  let completionsInPast30 = 0;
  for (let i = 0; i < 30; i++) {
    const d = shiftDate(todayStr, -i);
    const dayOfWeek = getDayOfWeek(d);
    if (frequency === "daily" || targetDays.includes(dayOfWeek)) {
      targetDaysInPast30++;
      if (dateSet.has(d)) {
        completionsInPast30++;
      }
    }
  }
  const completionRate =
    targetDaysInPast30 > 0
      ? Math.round((completionsInPast30 / targetDaysInPast30) * 100)
      : 0;

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    isCompletedToday,
    totalCompletions,
    completionRate,
  };
}

/**
 * Builds rolling 7-day completion history for UI week view
 */
export function buildWeekHistory(
  logDates: string[],
  options?: {
    today?: string;
    targetDays?: number[];
  }
): HabitDayStatus[] {
  const todayStr = options?.today || formatDateKey(new Date());
  const targetDays = options?.targetDays || [0, 1, 2, 3, 4, 5, 6];
  const dateSet = new Set(logDates);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const week: HabitDayStatus[] = [];

  // Generate 7 days ending with today (i.e. -6, -5, ..., 0)
  for (let i = 6; i >= 0; i--) {
    const d = shiftDate(todayStr, -i);
    const dateObj = new Date(`${d}T00:00:00`);
    const dayOfWeek = dateObj.getDay();

    week.push({
      date: d,
      dayLabel: dayLabels[dayOfWeek],
      dayNumber: dateObj.getDate(),
      isToday: d === todayStr,
      isTargetDay: targetDays.includes(dayOfWeek),
      completed: dateSet.has(d),
    });
  }

  return week;
}
