import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { Section } from "../src/models/Section";
import { Task } from "../src/models/Task";
import { Habit } from "../src/models/Habit";
import { HabitLog } from "../src/models/HabitLog";
import { Activity } from "../src/models/Activity";
import { Goal } from "../src/models/Goal";
import { userService } from "../src/server/services/user.service";
import { sectionService } from "../src/server/services/section.service";
import { taskService } from "../src/server/services/task.service";
import { habitService } from "../src/server/services/habit.service";
import { activityService } from "../src/server/services/activity.service";
import { goalService } from "../src/server/services/goal.service";
import { dashboardService } from "../src/server/services/dashboard.service";
import { formatDateKey, shiftDate } from "../src/server/services/streak.service";

async function runDashboardVerification() {
  console.log("=========================================");
  console.log("    DASHBOARD AGGREGATION SERVICE TESTS  ");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${detail ? ` — ${detail}` : ""}`);
      failed++;
    }
  }

  try {
    const conn = await connectDB();
    assert(conn.connection.readyState === 1, "MongoDB connected successfully");

    // Clean test data
    await User.deleteMany({ email: /test_dash_.*@example.com/ });
    await Section.deleteMany({});
    await Task.deleteMany({});
    await Habit.deleteMany({});
    await HabitLog.deleteMany({});
    await Activity.deleteMany({});
    await Goal.deleteMany({});

    // 1. Setup User & Section
    console.log("\n--- 1. Setting Up Test Environment ---");
    const user = await userService.registerUser({
      name: "Nikola Tesla",
      email: "test_dash_tesla@example.com",
      password: "AlternatingCurrent2026!",
    });
    const section = await sectionService.createSection(user.id, {
      name: "Electromagnetism",
      color: "#3b82f6",
    });
    assert(!!user.id && !!section.id, "User Tesla registered with Electromagnetism section");

    // 2. Create Tasks (1 Pending, 1 Completed Today)
    console.log("\n--- 2. Creating Tasks ---");
    const task1 = await taskService.createTask(user.id, {
      title: "Build Wardenclyffe Tower Prototype",
      sectionId: section.id,
      priority: "high",
    });
    const task2 = await taskService.createTask(user.id, {
      title: "Calibrate AC Polyphase Generator",
      sectionId: section.id,
      priority: "urgent",
    });
    // Mark task2 complete today
    await taskService.toggleTaskStatus(task2.id, user.id);
    assert(!!task1.id && !!task2.id, "2 Tasks created, 1 completed today");

    // 3. Create Habit & Log Check-in for Today and Yesterday
    console.log("\n--- 3. Creating Habits & Check-ins ---");
    const habit = await habitService.createHabit(user.id, {
      title: "Daily Laboratory Experimentation",
      frequency: "daily",
      sectionId: section.id,
    });
    const today = formatDateKey(new Date());
    const yesterday = shiftDate(today, -1);

    await habitService.toggleHabitLog(habit.id, user.id, today);
    await habitService.toggleHabitLog(habit.id, user.id, yesterday);
    assert(!!habit.id, "Habit created and checked in for today & yesterday");

    // 4. Log Manual Focus Activities
    console.log("\n--- 4. Logging Focus Activities ---");
    await activityService.createActivity(user.id, {
      title: "Wireless Power Transmission Testing",
      duration: 120, // 2 hours
      sectionId: section.id,
      tags: ["research", "energy"],
    });

    // 5. Create Goal
    console.log("\n--- 5. Creating Goal Target ---");
    const goal = await goalService.createGoal(user.id, {
      title: "File 20 Patents for Induction Motors",
      currentValue: 12,
      targetValue: 20,
      unit: "patents",
      sectionId: section.id,
    });
    assert(!!goal.id, "Goal target created");

    // 6. Execute Dashboard Aggregation
    console.log("\n--- 6. Running Central Dashboard Aggregation Service ---");
    const dashData = await dashboardService.getDashboardData(user.id);

    // Verify Today Tasks
    assert(dashData.todayTasksTotal === 2, "todayTasksTotal is 2 (1 pending + 1 completed today)");
    assert(dashData.todayTasksCompleted === 1, "todayTasksCompleted is 1");
    assert(dashData.completedTasks.length >= 1, "completedTasks list populated");

    // Verify Habits & Streaks
    assert(dashData.todayHabitsTotal === 1, "todayHabitsTotal is 1");
    assert(dashData.todayHabitsCompleted === 1, "todayHabitsCompleted is 1");
    assert(dashData.activeHabits.length === 1, "activeHabits list populated");
    assert(dashData.activeHabits[0].streak.currentStreak === 2, "Habit current streak is 2");

    // Verify Focus Activities
    assert(dashData.todayActivitiesCount >= 1, "todayActivitiesCount is at least 1");
    assert(dashData.todayActivitiesMinutes >= 120, "todayActivitiesMinutes is at least 120 minutes");

    // Verify Goals
    assert(dashData.goals.length === 1, "goals list contains active goal");
    assert(dashData.goals[0].progressPercentage === 60, "Goal progress is 60% (12/20)");

    // Verify Daily Completion Rate
    // (1 task done + 1 habit done) / (2 tasks + 1 habit) = 2/3 = 67%
    assert(dashData.dailyCompletionRate === 67, "dailyCompletionRate correctly calculated to 67% (2/3 items completed)");

    // Verify 7-Day Weekly Chart Metrics
    assert(dashData.weeklyMetrics.length === 7, "weeklyMetrics contains exactly 7 days");
    const todayMetric = dashData.weeklyMetrics[6];
    assert(todayMetric.isToday === true, "Last weekly metric item is today");
    assert(todayMetric.tasksCompleted === 1, "Today metric has 1 completed task");
    assert(todayMetric.habitsCompleted === 1, "Today metric has 1 habit check-in");
    assert(todayMetric.activityMinutes >= 120, "Today metric has 120+ activity minutes");

    const yesterdayMetric = dashData.weeklyMetrics[5];
    assert(yesterdayMetric.habitsCompleted === 1, "Yesterday metric has 1 habit check-in");

    // Cleanup
    await User.deleteMany({ email: /test_dash_.*@example.com/ });
    await Section.deleteMany({});
    await Task.deleteMany({});
    await Habit.deleteMany({});
    await HabitLog.deleteMany({});
    await Activity.deleteMany({});
    await Goal.deleteMany({});
    await conn.disconnect();

    console.log("\n=========================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=========================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Dashboard verification failed with error:", error);
    process.exit(1);
  }
}

runDashboardVerification();
