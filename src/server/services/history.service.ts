import connectDB from "@/lib/db";
import { Task } from "@/models/Task";
import { Activity } from "@/models/Activity";
import { Habit } from "@/models/Habit";
import { HabitLog } from "@/models/HabitLog";
import { Goal } from "@/models/Goal";
import { taskService } from "@/server/services/task.service";
import { activityService } from "@/server/services/activity.service";
import { habitService } from "@/server/services/habit.service";
import { goalService } from "@/server/services/goal.service";
import {
  formatDateKey,
  getDayOfWeek,
  shiftDate,
} from "@/server/services/streak.service";
import { ValidationError } from "@/lib/errors";
import {
  DayHistoryDTO,
  MonthHistoryDTO,
  DaySummaryDTO,
  TaskDTO,
  HabitDTO,
  ActivityDTO,
  GoalDTO,
} from "@/types";
import mongoose from "mongoose";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const historyService = {
  /**
   * Retrieves complete historical achievements and progress metrics for a specific date.
   */
  async getDayHistory(userId: string, dateStr: string): Promise<DayHistoryDTO> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new ValidationError("Invalid date format. Must be YYYY-MM-DD");
    }

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const todayStr = formatDateKey(new Date());

    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    const dayLabel = DAY_NAMES[dayOfWeek];

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    // Fetch domain entities in parallel
    const [habitLogs, allHabits, allTasks, allActivities, allGoals] =
      await Promise.all([
        HabitLog.find({
          userId: userObjectId,
          date: dateStr,
        }).exec(),
        habitService.getHabits(userId, { archived: false }),
        taskService.getTasks(userId),
        activityService.getActivities(userId, { limit: 200 }),
        goalService.getGoals(userId),
      ]);

    // 1. Habits completed on this date
    const loggedHabitIds = new Set(habitLogs.map((l) => l.habitId.toString()));
    const habitsCompleted = allHabits.filter((h) => loggedHabitIds.has(h.id));

    // Scheduled habits for this day of week
    const scheduledHabits = allHabits.filter((h) => {
      if (h.frequency === "daily") return true;
      return h.targetDays.includes(dayOfWeek);
    });
    const habitsScheduledCount = scheduledHabits.length;

    // 2. Tasks completed on this date
    const tasksCompleted = allTasks.filter((t) => {
      if (!t.completedAt) return false;
      return formatDateKey(new Date(t.completedAt)) === dateStr;
    });

    // 3. Activities recorded on this date
    const activities = allActivities.filter((a) => {
      return formatDateKey(new Date(a.occurredAt)) === dateStr;
    });

    const totalFocusMinutes = activities.reduce(
      (sum, a) => sum + (a.duration || 0),
      0
    );

    // 4. Goals updated on this date
    const goalsUpdated = allGoals.filter((g) => {
      return formatDateKey(new Date(g.updatedAt)) === dateStr;
    });

    // 5. Composite daily completion percentage
    const totalDailyItems = tasksCompleted.length + habitsScheduledCount;
    const totalDailyCompleted = tasksCompleted.length + habitsCompleted.length;
    let dailyCompletionRate = 0;

    if (totalDailyItems > 0) {
      dailyCompletionRate = Math.min(
        100,
        Math.round((totalDailyCompleted / totalDailyItems) * 100)
      );
    } else if (totalDailyCompleted > 0) {
      dailyCompletionRate = 100;
    }

    return {
      date: dateStr,
      dayLabel,
      dayNumber: day,
      isToday: dateStr === todayStr,
      dailyCompletionRate,
      totalFocusMinutes,
      totalActivitiesCount: activities.length,
      tasksCompleted,
      habitsCompleted,
      habitsScheduledCount,
      activities,
      goalsUpdated,
    };
  },

  /**
   * Retrieves month-level daily activity summary heatmap for the calendar grid.
   */
  async getMonthHistory(
    userId: string,
    yearMonthStr: string
  ): Promise<MonthHistoryDTO> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    if (!/^\d{4}-\d{2}$/.test(yearMonthStr)) {
      throw new ValidationError("Invalid month format. Must be YYYY-MM");
    }

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const todayStr = formatDateKey(new Date());

    const [year, month] = yearMonthStr.split("-").map(Number);
    const monthName = `${MONTH_NAMES[month - 1]} ${year}`;

    // Number of days in this month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Generate date keys for the whole month
    const monthDates: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayFormatted = String(d).padStart(2, "0");
      monthDates.push(`${yearMonthStr}-${dayFormatted}`);
    }

    const startOfMonth = new Date(`${yearMonthStr}-01T00:00:00.000Z`);
    const endOfMonth = new Date(year, month - 1, daysInMonth, 23, 59, 59, 999);

    // Concurrently fetch all month data from MongoDB
    const [monthLogs, monthTasks, monthActivities, activeHabits] =
      await Promise.all([
        HabitLog.find({
          userId: userObjectId,
          date: { $in: monthDates },
        }).exec(),
        Task.find({
          userId: userObjectId,
          status: "completed",
          completedAt: { $gte: startOfMonth, $lte: endOfMonth },
        }).exec(),
        Activity.find({
          userId: userObjectId,
          occurredAt: { $gte: startOfMonth, $lte: endOfMonth },
        }).exec(),
        Habit.find({
          userId: userObjectId,
          archived: false,
        }).exec(),
      ]);

    // Map logs by date
    const logsByDate = new Map<string, number>();
    monthLogs.forEach((l) => {
      logsByDate.set(l.date, (logsByDate.get(l.date) || 0) + 1);
    });

    // Map completed tasks by date
    const tasksByDate = new Map<string, number>();
    monthTasks.forEach((t) => {
      if (t.completedAt) {
        const dKey = formatDateKey(t.completedAt);
        tasksByDate.set(dKey, (tasksByDate.get(dKey) || 0) + 1);
      }
    });

    // Map activities & duration by date
    const activityCountByDate = new Map<string, number>();
    const activityMinutesByDate = new Map<string, number>();
    monthActivities.forEach((a) => {
      const dKey = formatDateKey(a.occurredAt);
      activityCountByDate.set(
        dKey,
        (activityCountByDate.get(dKey) || 0) + 1
      );
      activityMinutesByDate.set(
        dKey,
        (activityMinutesByDate.get(dKey) || 0) + (a.duration || 0)
      );
    });

    let totalFocusMinutes = 0;
    let totalTasksCompleted = 0;
    let totalHabitsCompleted = 0;
    let activeDaysCount = 0;

    const days: DaySummaryDTO[] = monthDates.map((dateStr, idx) => {
      const dayNumber = idx + 1;
      const dateObj = new Date(year, month - 1, dayNumber);
      const dayOfWeek = dateObj.getDay();
      const dayLabel = DAY_NAMES[dayOfWeek];

      const tasksCompletedCount = tasksByDate.get(dateStr) || 0;
      const habitsCompletedCount = logsByDate.get(dateStr) || 0;
      const activitiesCount = activityCountByDate.get(dateStr) || 0;
      const focusMinutes = activityMinutesByDate.get(dateStr) || 0;

      // Scheduled habits for this day
      const scheduledHabitsCount = activeHabits.filter((h) => {
        if (h.frequency === "daily") return true;
        return h.targetDays.includes(dayOfWeek);
      }).length;

      const totalItems = tasksCompletedCount + scheduledHabitsCount;
      const completedItems = tasksCompletedCount + habitsCompletedCount;
      let dailyCompletionRate = 0;

      if (totalItems > 0) {
        dailyCompletionRate = Math.min(
          100,
          Math.round((completedItems / totalItems) * 100)
        );
      } else if (completedItems > 0) {
        dailyCompletionRate = 100;
      }

      const hasActivity =
        tasksCompletedCount > 0 ||
        habitsCompletedCount > 0 ||
        activitiesCount > 0;

      if (hasActivity) {
        activeDaysCount++;
      }

      totalFocusMinutes += focusMinutes;
      totalTasksCompleted += tasksCompletedCount;
      totalHabitsCompleted += habitsCompletedCount;

      return {
        date: dateStr,
        dayNumber,
        dayLabel,
        isToday: dateStr === todayStr,
        dailyCompletionRate,
        tasksCompletedCount,
        habitsCompletedCount,
        activitiesCount,
        focusMinutes,
        hasActivity,
      };
    });

    return {
      yearMonth: yearMonthStr,
      monthName,
      days,
      totalFocusMinutes,
      totalTasksCompleted,
      totalHabitsCompleted,
      activeDaysCount,
    };
  },
};
