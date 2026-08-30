import connectDB from "@/lib/db";
import { taskService } from "@/server/services/task.service";
import { habitService } from "@/server/services/habit.service";
import { activityService } from "@/server/services/activity.service";
import { goalService } from "@/server/services/goal.service";
import { formatDateKey, shiftDate } from "@/server/services/streak.service";
import { HabitLog } from "@/models/HabitLog";
import { Habit } from "@/models/Habit";
import { Task } from "@/models/Task";
import { Activity } from "@/models/Activity";
import { Section } from "@/models/Section";
import { Goal } from "@/models/Goal";
import { DashboardDataDTO, NavigationCountsDTO, WeeklyDayMetric } from "@/types";
import mongoose from "mongoose";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const dashboardService = {
  /**
   * Aggregates all live dashboard data concurrently without duplicating database logic.
   */
  async getDashboardData(userId: string): Promise<DashboardDataDTO> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const todayDate = formatDateKey(new Date());
    const todayDayOfWeek = new Date().getDay(); // 0 = Sun, 1 = Mon...

    // 1. Concurrently fetch domain entities
    const [allTasks, activeHabits, recentActivities, goals] = await Promise.all([
      taskService.getTasks(userId),
      habitService.getHabits(userId, { archived: false }),
      activityService.getActivities(userId, { limit: 12 }),
      goalService.getGoals(userId, { status: "in_progress" }),
    ]);

    // 2. Classify tasks for today and completed tasks
    const todayTasks = allTasks.filter((task) => {
      if (task.status === "pending") return true;
      if (task.completedAt) {
        const completedDate = formatDateKey(new Date(task.completedAt));
        return completedDate === todayDate;
      }
      return false;
    });

    const completedTasks = allTasks
      .filter((t) => t.status === "completed")
      .slice(0, 10);

    const todayTasksCompleted = todayTasks.filter((t) => t.status === "completed").length;
    const todayTasksTotal = todayTasks.length;

    // 3. Filter today's activities & calculate today's total active duration
    const todayActivities = recentActivities.filter((act) => {
      const actDate = formatDateKey(new Date(act.occurredAt));
      return actDate === todayDate;
    });

    const todayActivitiesMinutes = todayActivities.reduce(
      (sum, act) => sum + (act.duration || 0),
      0
    );
    const todayActivitiesCount = todayActivities.length;

    // 4. Habits scheduled for today & completed today
    const scheduledHabitsToday = activeHabits.filter((h) => {
      if (h.frequency === "daily") return true;
      return h.targetDays.includes(todayDayOfWeek);
    });

    const todayHabitsTotal = scheduledHabitsToday.length;
    const todayHabitsCompleted = scheduledHabitsToday.filter(
      (h) => h.streak.isCompletedToday
    ).length;

    // 5. Calculate composite daily completion rate
    const totalDailyItems = todayTasksTotal + todayHabitsTotal;
    const totalDailyCompleted = todayTasksCompleted + todayHabitsCompleted;
    const dailyCompletionRate =
      totalDailyItems > 0
        ? Math.min(100, Math.round((totalDailyCompleted / totalDailyItems) * 100))
        : 0;

    // 6. Aggregate 7-day rolling weekly metrics
    // Days array from 6 days ago up to today
    const past7Dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      past7Dates.push(shiftDate(todayDate, -i));
    }

    const startDate = new Date(`${past7Dates[0]}T00:00:00.000Z`);

    // Concurrently query week aggregations from MongoDB
    const [weekLogs, weekCompletedTasks, weekActivities] = await Promise.all([
      HabitLog.find({
        userId: userObjectId,
        date: { $in: past7Dates },
      }).exec(),
      Task.find({
        userId: userObjectId,
        status: "completed",
        completedAt: { $gte: startDate },
      }).exec(),
      Activity.find({
        userId: userObjectId,
        occurredAt: { $gte: startDate },
      }).exec(),
    ]);

    // Map logs by date
    const logsByDate = new Map<string, number>();
    weekLogs.forEach((l) => {
      logsByDate.set(l.date, (logsByDate.get(l.date) || 0) + 1);
    });

    // Map completed tasks by date
    const tasksByDate = new Map<string, number>();
    weekCompletedTasks.forEach((t) => {
      if (t.completedAt) {
        const dKey = formatDateKey(new Date(t.completedAt));
        tasksByDate.set(dKey, (tasksByDate.get(dKey) || 0) + 1);
      }
    });

    // Map activity minutes by date
    const activityMinutesByDate = new Map<string, number>();
    weekActivities.forEach((a) => {
      const dKey = formatDateKey(new Date(a.occurredAt));
      activityMinutesByDate.set(
        dKey,
        (activityMinutesByDate.get(dKey) || 0) + (a.duration || 0)
      );
    });

    const weeklyMetrics: WeeklyDayMetric[] = past7Dates.map((dateStr) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      const dayLabel = DAY_NAMES[d.getDay()];

      return {
        date: dateStr,
        dayLabel,
        dayNumber: day,
        isToday: dateStr === todayDate,
        activityMinutes: activityMinutesByDate.get(dateStr) || 0,
        tasksCompleted: tasksByDate.get(dateStr) || 0,
        habitsCompleted: logsByDate.get(dateStr) || 0,
      };
    });

    return {
      todayDate,
      dailyCompletionRate,
      todayTasksTotal,
      todayTasksCompleted,
      todayHabitsTotal,
      todayHabitsCompleted,
      todayActivitiesMinutes,
      todayActivitiesCount,
      todayTasks,
      completedTasks,
      todayActivities,
      activeHabits,
      goals,
      recentActivities,
      weeklyMetrics,
    };
  },

  /**
   * Fast aggregated navigation counts for active tasks, habits, sections, and goals.
   * Matches live metrics shown on the dashboard command center.
   */
  async getNavigationCounts(userId: string): Promise<NavigationCountsDTO> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return { sections: 0, tasks: 0, habits: 0, goals: 0 };
    }

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const todayDate = formatDateKey(new Date());
    const startOfToday = new Date(`${todayDate}T00:00:00.000Z`);

    const [sectionsCount, tasksCount, habitsCount, goalsCount] = await Promise.all([
      Section.countDocuments({ userId: userObjectId }),
      Task.countDocuments({
        userId: userObjectId,
        $or: [
          { status: "pending" },
          { status: "completed", completedAt: { $gte: startOfToday } },
        ],
      }),
      Habit.countDocuments({ userId: userObjectId, archived: false }),
      Goal.countDocuments({ userId: userObjectId, status: "in_progress" }),
    ]);

    return {
      sections: sectionsCount,
      tasks: tasksCount,
      habits: habitsCount,
      goals: goalsCount,
    };
  },
};

