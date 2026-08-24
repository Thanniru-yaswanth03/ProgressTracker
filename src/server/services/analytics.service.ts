import connectDB from "@/lib/db";
import { Section } from "@/models/Section";
import { Task } from "@/models/Task";
import { Activity } from "@/models/Activity";
import { Habit } from "@/models/Habit";
import { HabitLog } from "@/models/HabitLog";
import { Goal } from "@/models/Goal";
import {
  formatDateKey,
  shiftDate,
  calculateHabitStreak,
} from "@/server/services/streak.service";
import { ValidationError } from "@/lib/errors";
import {
  AnalyticsDTO,
  WeeklyOverviewDTO,
  MonthlyOverviewDTO,
  TaskStatsDTO,
  HabitStatsDTO,
  StreakStatsDTO,
  ActivityStatsDTO,
  GoalStatsDTO,
  ActiveDaysStatsDTO,
  WeeklyDayMetric,
  MonthlyWeekTrend,
  TaskPriorityBreakdown,
  SectionBreakdownItem,
  TagBreakdownItem,
  HabitPerformanceItem,
  TaskPriority,
  SectionDTO,
  GoalDTO,
} from "@/types";
import mongoose from "mongoose";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PRIORITIES: TaskPriority[] = ["urgent", "high", "medium", "low"];

export const analyticsService = {
  /**
   * Aggregates all analytics dimensions across the entire repository for the authenticated user.
   * Uses optimized batch queries and in-memory aggregation to avoid N+1 query overhead.
   */
  async getAnalytics(userId: string): Promise<AnalyticsDTO> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const todayStr = formatDateKey(new Date());

    // 1. Concurrently fetch all user collections with lean projections in a single batch
    const [sections, tasks, habits, habitLogs, activities, goals] =
      await Promise.all([
        Section.find({ userId: userObjectId })
          .sort({ order: 1 })
          .select("_id userId name color description order createdAt updatedAt")
          .lean()
          .exec(),
        Task.find({ userId: userObjectId })
          .select("_id userId status priority sectionId completedAt createdAt")
          .lean()
          .exec(),
        Habit.find({ userId: userObjectId })
          .select("_id userId title frequency targetDays sectionId archived createdAt")
          .lean()
          .exec(),
        HabitLog.find({ userId: userObjectId })
          .select("_id habitId date completed")
          .lean()
          .exec(),
        Activity.find({ userId: userObjectId })
          .sort({ occurredAt: -1 })
          .select("_id userId title duration tags occurredAt sectionId")
          .lean()
          .exec(),
        Goal.find({ userId: userObjectId })
          .sort({ createdAt: -1 })
          .select("_id userId title description targetValue currentValue unit targetDate status sectionId createdAt updatedAt")
          .lean()
          .exec(),
      ]);

    // Section lookup map
    const sectionMap = new Map<string, SectionDTO>();
    sections.forEach((s) => {
      sectionMap.set(s._id.toString(), {
        id: s._id.toString(),
        userId: s.userId.toString(),
        name: s.name,
        color: s.color,
        description: s.description || "",
        order: s.order || 0,
        createdAt: new Date(s.createdAt).toISOString(),
        updatedAt: new Date(s.updatedAt).toISOString(),
      });
    });

    // 2. Generate Date Windows (Past 7 Days & Past 30 Days)
    const past7Dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      past7Dates.push(shiftDate(todayStr, -i));
    }
    const past7Set = new Set(past7Dates);

    const past30Dates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      past30Dates.push(shiftDate(todayStr, -i));
    }
    const past30Set = new Set(past30Dates);

    // 3. Pre-index Habit Logs
    const logsByHabitId = new Map<string, string[]>();
    const logsByDate = new Map<string, number>();
    habitLogs.forEach((l) => {
      const hId = l.habitId.toString();
      if (!logsByHabitId.has(hId)) {
        logsByHabitId.set(hId, []);
      }
      logsByHabitId.get(hId)!.push(l.date);

      logsByDate.set(l.date, (logsByDate.get(l.date) || 0) + 1);
    });

    // Pre-index Completed Tasks by Date
    const completedTasksByDate = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.status === "completed" && t.completedAt) {
        const dKey = formatDateKey(new Date(t.completedAt));
        completedTasksByDate.set(
          dKey,
          (completedTasksByDate.get(dKey) || 0) + 1
        );
      }
    });

    // Pre-index Activities by Date
    const activitiesByDate = new Map<string, { count: number; minutes: number }>();
    activities.forEach((a) => {
      const dKey = formatDateKey(new Date(a.occurredAt));
      const existing = activitiesByDate.get(dKey) || { count: 0, minutes: 0 };
      activitiesByDate.set(dKey, {
        count: existing.count + 1,
        minutes: existing.minutes + (a.duration || 0),
      });
    });

    // 4. Compute Weekly Overview (Last 7 Days)
    let weeklyTasksCompleted = 0;
    let weeklyHabitsCompleted = 0;
    let weeklyFocusMinutes = 0;
    let weeklyActivitiesCount = 0;
    let weeklyActiveDays = 0;
    let weeklyCompletionSum = 0;

    const weeklyDays: WeeklyDayMetric[] = past7Dates.map((dateStr) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      const dayLabel = DAY_NAMES[d.getDay()];
      const dayOfWeek = d.getDay();

      const tasksDone = completedTasksByDate.get(dateStr) || 0;
      const habitsDone = logsByDate.get(dateStr) || 0;
      const actInfo = activitiesByDate.get(dateStr) || { count: 0, minutes: 0 };

      weeklyTasksCompleted += tasksDone;
      weeklyHabitsCompleted += habitsDone;
      weeklyFocusMinutes += actInfo.minutes;
      weeklyActivitiesCount += actInfo.count;

      if (tasksDone > 0 || habitsDone > 0 || actInfo.count > 0) {
        weeklyActiveDays++;
      }

      // Scheduled habits for this day
      const scheduledHabitsCount = habits.filter((h) => {
        if (h.archived) return false;
        if (h.frequency === "daily") return true;
        return h.targetDays.includes(dayOfWeek);
      }).length;

      const totalItems = tasksDone + scheduledHabitsCount;
      const completedItems = tasksDone + habitsDone;
      let dayRate = 0;
      if (totalItems > 0) {
        dayRate = Math.min(100, Math.round((completedItems / totalItems) * 100));
      } else if (completedItems > 0) {
        dayRate = 100;
      }
      weeklyCompletionSum += dayRate;

      return {
        date: dateStr,
        dayLabel,
        dayNumber: day,
        isToday: dateStr === todayStr,
        activityMinutes: actInfo.minutes,
        tasksCompleted: tasksDone,
        habitsCompleted: habitsDone,
      };
    });

    const weeklyOverview: WeeklyOverviewDTO = {
      days: weeklyDays,
      totalTasksCompleted: weeklyTasksCompleted,
      totalHabitsCompleted: weeklyHabitsCompleted,
      totalFocusMinutes: weeklyFocusMinutes,
      totalActivitiesCount: weeklyActivitiesCount,
      activeDaysCount: weeklyActiveDays,
      averageDailyCompletionRate: Math.round(weeklyCompletionSum / 7),
    };

    // 5. Compute Monthly Overview & 4-Week Trend Groupings (Past 30 Days)
    let monthlyTasksCompleted = 0;
    let monthlyHabitsCompleted = 0;
    let monthlyFocusMinutes = 0;
    let monthlyActivitiesCount = 0;
    let monthlyActiveDays = 0;

    past30Dates.forEach((dateStr) => {
      const tasksDone = completedTasksByDate.get(dateStr) || 0;
      const habitsDone = logsByDate.get(dateStr) || 0;
      const actInfo = activitiesByDate.get(dateStr) || { count: 0, minutes: 0 };

      monthlyTasksCompleted += tasksDone;
      monthlyHabitsCompleted += habitsDone;
      monthlyFocusMinutes += actInfo.minutes;
      monthlyActivitiesCount += actInfo.count;

      if (tasksDone > 0 || habitsDone > 0 || actInfo.count > 0) {
        monthlyActiveDays++;
      }
    });

    // Group 30 days into 4 sequential buckets
    const weekTrends: MonthlyWeekTrend[] = [];
    const chunkSize = Math.ceil(past30Dates.length / 4);
    for (let w = 0; w < 4; w++) {
      const chunk = past30Dates.slice(w * chunkSize, (w + 1) * chunkSize);
      if (chunk.length === 0) continue;

      let wTasks = 0;
      let wHabits = 0;
      let wFocus = 0;
      let wActive = 0;

      chunk.forEach((dStr) => {
        const tCount = completedTasksByDate.get(dStr) || 0;
        const hCount = logsByDate.get(dStr) || 0;
        const aInfo = activitiesByDate.get(dStr) || { count: 0, minutes: 0 };

        wTasks += tCount;
        wHabits += hCount;
        wFocus += aInfo.minutes;
        if (tCount > 0 || hCount > 0 || aInfo.count > 0) {
          wActive++;
        }
      });

      weekTrends.push({
        weekLabel: `Week ${w + 1}`,
        startDate: chunk[0],
        endDate: chunk[chunk.length - 1],
        tasksCompleted: wTasks,
        habitsCompleted: wHabits,
        focusMinutes: wFocus,
        activeDaysCount: wActive,
      });
    }

    const monthlyOverview: MonthlyOverviewDTO = {
      totalTasksCompleted: monthlyTasksCompleted,
      totalHabitsCompleted: monthlyHabitsCompleted,
      totalFocusMinutes: monthlyFocusMinutes,
      totalActivitiesCount: monthlyActivitiesCount,
      activeDaysCount: monthlyActiveDays,
      consistencyRate: Math.round((monthlyActiveDays / 30) * 100),
      weekTrends,
    };

    // 6. Compute Task Statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const pendingTasks = totalTasks - completedTasks;
    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const priorityBreakdown: TaskPriorityBreakdown[] = PRIORITIES.map((p) => {
      const priTasks = tasks.filter((t) => t.priority === p);
      const priCompleted = priTasks.filter((t) => t.status === "completed").length;
      return {
        priority: p,
        total: priTasks.length,
        completed: priCompleted,
        completionRate:
          priTasks.length > 0
            ? Math.round((priCompleted / priTasks.length) * 100)
            : 0,
      };
    });

    // Section breakdown for Tasks
    const taskSectionCount = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.status === "completed" && t.sectionId) {
        const sId = t.sectionId.toString();
        taskSectionCount.set(sId, (taskSectionCount.get(sId) || 0) + 1);
      }
    });

    // Section breakdown for Activities
    const actSectionCount = new Map<string, { count: number; minutes: number }>();
    activities.forEach((a) => {
      if (a.sectionId) {
        const sId = a.sectionId.toString();
        const existing = actSectionCount.get(sId) || { count: 0, minutes: 0 };
        actSectionCount.set(sId, {
          count: existing.count + 1,
          minutes: existing.minutes + (a.duration || 0),
        });
      }
    });

    const sectionBreakdown: SectionBreakdownItem[] = sections.map((s) => {
      const sId = s._id.toString();
      const actData = actSectionCount.get(sId) || { count: 0, minutes: 0 };
      return {
        sectionId: sId,
        sectionName: s.name,
        color: s.color,
        tasksCompleted: taskSectionCount.get(sId) || 0,
        focusMinutes: actData.minutes,
        activityCount: actData.count,
      };
    });

    const taskStats: TaskStatsDTO = {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate: taskCompletionRate,
      priorityBreakdown,
      sectionBreakdown,
    };

    // 7. Compute Habit Statistics & Streak Leaderboard
    const habitsPerformance: HabitPerformanceItem[] = habits.map((h) => {
      const hId = h._id.toString();
      const hLogs = logsByHabitId.get(hId) || [];
      const streak = calculateHabitStreak(hLogs, {
        today: todayStr,
        frequency: h.frequency,
        targetDays: h.targetDays,
      });

      // Count past 30 days check-ins
      const past30Logs = hLogs.filter((d) => past30Set.has(d)).length;

      // Count past 30 days scheduled opportunities
      let past30Scheduled = 0;
      past30Dates.forEach((dStr) => {
        const dObj = new Date(dStr);
        const dow = dObj.getDay();
        if (h.frequency === "daily" || h.targetDays.includes(dow)) {
          past30Scheduled++;
        }
      });

      const hRate =
        past30Scheduled > 0
          ? Math.min(100, Math.round((past30Logs / past30Scheduled) * 100))
          : past30Logs > 0
          ? 100
          : 0;

      const sec = h.sectionId ? sectionMap.get(h.sectionId.toString()) : undefined;

      return {
        id: hId,
        title: h.title,
        frequency: h.frequency,
        section: sec,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        past30DaysLogsCount: past30Logs,
        past30DaysScheduledCount: past30Scheduled,
        completionRate: hRate,
      };
    });

    // Total logs all time & past 30d
    const totalLogsAllTime = habitLogs.length;
    const totalLogsPast30Days = habitLogs.filter((l) =>
      past30Set.has(l.date)
    ).length;

    // Overall 30d habit completion rate
    const totalScheduledPast30 = habitsPerformance.reduce(
      (sum, h) => sum + h.past30DaysScheduledCount,
      0
    );
    const overallHabitRate =
      totalScheduledPast30 > 0
        ? Math.min(100, Math.round((totalLogsPast30Days / totalScheduledPast30) * 100))
        : totalLogsPast30Days > 0
        ? 100
        : 0;

    const habitStats: HabitStatsDTO = {
      totalHabits: habits.length,
      totalLogsAllTime,
      totalLogsPast30Days,
      overallCompletionRate: overallHabitRate,
      habitsPerformance,
    };

    // Streak stats
    let bestCurrentStreak = 0;
    let bestCurrentHabitTitle: string | null = null;
    let bestLongestStreak = 0;
    let bestLongestHabitTitle: string | null = null;
    let currentStreakSum = 0;

    habitsPerformance.forEach((h) => {
      currentStreakSum += h.currentStreak;
      if (h.currentStreak > bestCurrentStreak) {
        bestCurrentStreak = h.currentStreak;
        bestCurrentHabitTitle = h.title;
      }
      if (h.longestStreak > bestLongestStreak) {
        bestLongestStreak = h.longestStreak;
        bestLongestHabitTitle = h.title;
      }
    });

    const averageCurrentStreak =
      habitsPerformance.length > 0
        ? Math.round(currentStreakSum / habitsPerformance.length)
        : 0;

    const streakStats: StreakStatsDTO = {
      bestCurrentStreak,
      bestCurrentHabitTitle,
      bestLongestStreak,
      bestLongestHabitTitle,
      averageCurrentStreak,
    };

    // 8. Compute Activity Statistics & Top Tags
    const totalActivitiesAllTime = activities.length;
    const totalActivitiesPast30Days = activities.filter((a) =>
      past30Set.has(formatDateKey(new Date(a.occurredAt)))
    ).length;
    const totalActivitiesPast7Days = activities.filter((a) =>
      past7Set.has(formatDateKey(new Date(a.occurredAt)))
    ).length;

    let totalDurationMinutesAllTime = 0;
    let totalDurationMinutesPast30Days = 0;
    let totalDurationMinutesPast7Days = 0;

    const tagMap = new Map<string, { count: number; minutes: number }>();

    activities.forEach((a) => {
      const dur = a.duration || 0;
      const dKey = formatDateKey(new Date(a.occurredAt));

      totalDurationMinutesAllTime += dur;
      if (past30Set.has(dKey)) {
        totalDurationMinutesPast30Days += dur;
      }
      if (past7Set.has(dKey)) {
        totalDurationMinutesPast7Days += dur;
      }

      if (a.tags && Array.isArray(a.tags)) {
        a.tags.forEach((tag: string) => {
          const tKey = tag.toLowerCase().trim();
          if (tKey) {
            const existing = tagMap.get(tKey) || { count: 0, minutes: 0 };
            tagMap.set(tKey, {
              count: existing.count + 1,
              minutes: existing.minutes + dur,
            });
          }
        });
      }
    });

    const averageSessionMinutes =
      totalActivitiesAllTime > 0
        ? Math.round(totalDurationMinutesAllTime / totalActivitiesAllTime)
        : 0;

    const topTags: TagBreakdownItem[] = Array.from(tagMap.entries())
      .map(([tag, data]) => ({
        tag,
        count: data.count,
        focusMinutes: data.minutes,
      }))
      .sort((a, b) => b.focusMinutes - a.focusMinutes)
      .slice(0, 8);

    const activityStats: ActivityStatsDTO = {
      totalActivitiesAllTime,
      totalActivitiesPast30Days,
      totalActivitiesPast7Days,
      totalDurationMinutesAllTime,
      totalDurationMinutesPast30Days,
      totalDurationMinutesPast7Days,
      averageSessionMinutes,
      sectionBreakdown,
      topTags,
    };

    // 9. Compute Goal Statistics
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.status === "completed").length;
    const inProgressGoals = goals.filter((g) => g.status === "in_progress").length;
    const pausedGoals = goals.filter((g) => g.status === "paused").length;

    const goalCompletionRate =
      totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    let progressSum = 0;
    const goalsList: GoalDTO[] = goals.map((g) => {
      const gProgress =
        g.targetValue > 0
          ? Math.min(100, Math.max(0, Math.round((g.currentValue / g.targetValue) * 100)))
          : 0;
      progressSum += gProgress;

      const sec = g.sectionId ? sectionMap.get(g.sectionId.toString()) : undefined;

      return {
        id: g._id.toString(),
        userId: g.userId.toString(),
        sectionId: g.sectionId ? g.sectionId.toString() : undefined,
        section: sec,
        title: g.title,
        description: g.description,
        targetValue: g.targetValue,
        currentValue: g.currentValue,
        unit: g.unit,
        targetDate: g.targetDate ? new Date(g.targetDate).toISOString() : undefined,
        status: g.status,
        progressPercentage: gProgress,
        createdAt: new Date(g.createdAt).toISOString(),
        updatedAt: new Date(g.updatedAt).toISOString(),
      };
    });

    const averageProgressPercentage =
      totalGoals > 0 ? Math.round(progressSum / totalGoals) : 0;

    const goalStats: GoalStatsDTO = {
      totalGoals,
      inProgressGoals,
      completedGoals,
      pausedGoals,
      completionRate: goalCompletionRate,
      averageProgressPercentage,
      goals: goalsList,
    };

    // 10. Compute Active Days All-Time
    const allActiveDatesSet = new Set<string>();
    tasks.forEach((t) => {
      if (t.status === "completed" && t.completedAt) {
        allActiveDatesSet.add(formatDateKey(new Date(t.completedAt)));
      }
    });
    habitLogs.forEach((l) => {
      allActiveDatesSet.add(l.date);
    });
    activities.forEach((a) => {
      allActiveDatesSet.add(formatDateKey(new Date(a.occurredAt)));
    });

    const activeDaysAllTime = allActiveDatesSet.size;
    const activeDaysPast30Days = past30Dates.filter((d) =>
      allActiveDatesSet.has(d)
    ).length;
    const activeDaysPast7Days = past7Dates.filter((d) =>
      allActiveDatesSet.has(d)
    ).length;
    const consistencyScore = Math.round((activeDaysPast30Days / 30) * 100);

    const activeDaysStats: ActiveDaysStatsDTO = {
      activeDaysAllTime,
      activeDaysPast30Days,
      activeDaysPast7Days,
      consistencyScore,
    };

    return {
      weeklyOverview,
      monthlyOverview,
      taskStats,
      habitStats,
      streakStats,
      activityStats,
      goalStats,
      activeDaysStats,
    };
  },
};
