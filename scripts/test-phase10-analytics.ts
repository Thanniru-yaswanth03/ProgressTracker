import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Section } from "@/models/Section";
import { Task } from "@/models/Task";
import { Activity } from "@/models/Activity";
import { Habit } from "@/models/Habit";
import { HabitLog } from "@/models/HabitLog";
import { Goal } from "@/models/Goal";
import { userService } from "@/server/services/user.service";
import { sectionService } from "@/server/services/section.service";
import { taskService } from "@/server/services/task.service";
import { activityService } from "@/server/services/activity.service";
import { habitService } from "@/server/services/habit.service";
import { goalService } from "@/server/services/goal.service";
import { analyticsService } from "@/server/services/analytics.service";
import { formatDateKey, shiftDate } from "@/server/services/streak.service";
import mongoose from "mongoose";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

async function run() {
  console.log("=========================================");
  console.log("     PHASE 10: ANALYTICS TEST SUITE      ");
  console.log("=========================================\n");

  await connectDB();

  const timestamp = Date.now();
  const emailA = `analytics.test.a.${timestamp}@example.com`;
  const emailB = `analytics.test.b.${timestamp}@example.com`;
  const pass = "Password123!";

  let userA: { id: string; name?: string | null; email?: string | null } | null = null;
  let userB: { id: string; name?: string | null; email?: string | null } | null = null;

  try {
    // 1. Setup Test Users
    console.log("--- 1. Setting Up Test Accounts ---");
    userA = await userService.registerUser({
      name: "Isaac Newton",
      email: emailA,
      password: pass,
    });
    userB = await userService.registerUser({
      name: "Gottfried Leibniz",
      email: emailB,
      password: pass,
    });
    assert(!!userA?.id && !!userB?.id, "Test Users Newton (A) and Leibniz (B) registered");

    // Create Sections for User A
    const sec1 = await sectionService.createSection(userA.id, {
      name: "Classical Mechanics",
      color: "#6366f1",
    });
    const sec2 = await sectionService.createSection(userA.id, {
      name: "Calculus & Optics",
      color: "#10b981",
    });
    assert(!!sec1.id && !!sec2.id, "2 Sections created for User A");

    const todayStr = formatDateKey(new Date());
    const yesterdayStr = shiftDate(todayStr, -1);
    const twoDaysAgoStr = shiftDate(todayStr, -2);
    const fiveDaysAgoStr = shiftDate(todayStr, -5);

    // 2. Populate Comprehensive Domain Data
    console.log("\n--- 2. Populating User Data Across All Dimensions ---");

    // Tasks (5 total: 3 completed, 2 pending)
    const t1 = await taskService.createTask(userA.id, {
      title: "Derive Principia equations",
      sectionId: sec1.id,
      priority: "urgent",
    });
    await taskService.toggleTaskStatus(t1.id, userA.id, "completed");

    const t2 = await taskService.createTask(userA.id, {
      title: "Prism light refraction experiments",
      sectionId: sec2.id,
      priority: "high",
    });
    await taskService.toggleTaskStatus(t2.id, userA.id, "completed");

    const t3 = await taskService.createTask(userA.id, {
      title: "Fluxions mathematical foundations",
      sectionId: sec2.id,
      priority: "medium",
    });
    await taskService.toggleTaskStatus(t3.id, userA.id, "completed");

    const t4 = await taskService.createTask(userA.id, {
      title: "Write alchemy treatise",
      priority: "low",
    });
    const t5 = await taskService.createTask(userA.id, {
      title: "Mint currency inspection",
      sectionId: sec1.id,
      priority: "high",
    });
    assert(true, "5 tasks created (3 completed, 2 pending)");

    // Habits (2 habits with active check-in streaks)
    const h1 = await habitService.createHabit(userA.id, {
      title: "Daily Mathematical Derivations",
      frequency: "daily",
      sectionId: sec2.id,
    });
    // Check-ins for h1 across 3 consecutive days
    await habitService.toggleHabitLog(h1.id, userA.id, twoDaysAgoStr);
    await habitService.toggleHabitLog(h1.id, userA.id, yesterdayStr);
    await habitService.toggleHabitLog(h1.id, userA.id, todayStr);

    const h2 = await habitService.createHabit(userA.id, {
      title: "Evening Reflection & Journaling",
      frequency: "daily",
      sectionId: sec1.id,
    });
    await habitService.toggleHabitLog(h2.id, userA.id, todayStr);
    assert(true, "2 habits created with check-in streaks");

    // Activities (4 activities across sections & tags)
    await activityService.createActivity(userA.id, {
      title: "Gravity inverse square proof",
      sectionId: sec1.id,
      duration: 90,
      tags: ["physics", "math"],
      occurredAt: `${todayStr}T10:00:00`,
    });
    await activityService.createActivity(userA.id, {
      title: "Optics spectrum diagramming",
      sectionId: sec2.id,
      duration: 60,
      tags: ["optics", "light"],
      occurredAt: `${yesterdayStr}T14:00:00`,
    });
    await activityService.createActivity(userA.id, {
      title: "Calculus integration tables",
      sectionId: sec2.id,
      duration: 45,
      tags: ["math", "calculus"],
      occurredAt: `${twoDaysAgoStr}T09:00:00`,
    });
    await activityService.createActivity(userA.id, {
      title: "Planetary orbit calculations",
      sectionId: sec1.id,
      duration: 120,
      tags: ["physics", "astronomy"],
      occurredAt: `${fiveDaysAgoStr}T16:00:00`,
    });
    assert(true, "4 focus activities recorded (total 315 mins)");

    // Goals (3 goals: 1 completed, 1 in_progress, 1 paused)
    await goalService.createGoal(userA.id, {
      title: "Complete 100 Physics Proofs",
      targetValue: 100,
      currentValue: 100, // completed
      unit: "proofs",
      sectionId: sec1.id,
    });
    const g2 = await goalService.createGoal(userA.id, {
      title: "Write 20 Optics Chapters",
      targetValue: 20,
      currentValue: 12, // 60%
      unit: "chapters",
      sectionId: sec2.id,
    });
    const g3 = await goalService.createGoal(userA.id, {
      title: "Telescope Construction",
      targetValue: 10,
      currentValue: 3,
      unit: "parts",
    });
    await goalService.togglePauseGoal(g3.id, userA.id); // paused
    assert(true, "3 goals created (1 completed, 1 in_progress, 1 paused)");

    // 3. Testing Analytics Service on User A
    console.log("\n--- 3. Running Analytics Aggregation Engine ---");
    const analytics = await analyticsService.getAnalytics(userA.id);

    // Dimension 1: Weekly Overview
    console.log("\n-> Dimension 1: Weekly Overview");
    assert(analytics.weeklyOverview.days.length === 7, "Weekly overview contains exactly 7 days");
    assert(analytics.weeklyOverview.totalTasksCompleted >= 3, `Weekly tasks completed aggregated (got ${analytics.weeklyOverview.totalTasksCompleted})`);
    assert(analytics.weeklyOverview.totalHabitsCompleted >= 4, `Weekly habits completed aggregated (got ${analytics.weeklyOverview.totalHabitsCompleted})`);
    assert(analytics.weeklyOverview.totalFocusMinutes >= 315, `Weekly focus minutes aggregated (got ${analytics.weeklyOverview.totalFocusMinutes} mins)`);
    assert(analytics.weeklyOverview.activeDaysCount >= 4, `Weekly active days count verified (got ${analytics.weeklyOverview.activeDaysCount})`);

    // Dimension 2: Monthly Overview
    console.log("\n-> Dimension 2: Monthly Overview");
    assert(analytics.monthlyOverview.totalTasksCompleted >= 3, "Monthly total tasks aggregated");
    assert(analytics.monthlyOverview.totalFocusMinutes >= 315, "Monthly focus minutes aggregated");
    assert(analytics.monthlyOverview.activeDaysCount >= 4, "Monthly active days count aggregated");
    assert(analytics.monthlyOverview.consistencyRate >= 13, `Monthly consistency rate calculated (${analytics.monthlyOverview.consistencyRate}%)`);
    assert(analytics.monthlyOverview.weekTrends.length === 4, "Monthly trends divided into 4 sequential week buckets");

    // Dimension 3: Task Statistics
    console.log("\n-> Dimension 3: Task Completion Statistics");
    assert(analytics.taskStats.totalTasks === 5, "Total tasks count is 5");
    assert(analytics.taskStats.completedTasks === 3, "Completed tasks count is 3");
    assert(analytics.taskStats.pendingTasks === 2, "Pending tasks count is 2");
    assert(analytics.taskStats.completionRate === 60, `Task completion rate is 60% (${analytics.taskStats.completionRate}%)`);
    assert(analytics.taskStats.priorityBreakdown.length === 4, "Priority breakdown includes all 4 priority levels");
    const urgentPri = analytics.taskStats.priorityBreakdown.find((p) => p.priority === "urgent");
    assert(urgentPri?.total === 1 && urgentPri?.completed === 1 && urgentPri?.completionRate === 100, "Urgent priority task is 100% completed");

    // Dimension 4 & 5: Habit Statistics & Streaks
    console.log("\n-> Dimensions 4 & 5: Habit Rates & Streak Champions");
    assert(analytics.habitStats.totalHabits === 2, "Total habits count is 2");
    assert(analytics.habitStats.totalLogsAllTime === 4, `Total habit logs count is 4 (got ${analytics.habitStats.totalLogsAllTime})`);
    assert(analytics.habitStats.overallCompletionRate > 0, `Overall habit completion rate is positive (${analytics.habitStats.overallCompletionRate}%)`);
    assert(analytics.streakStats.bestCurrentStreak === 3, `Best current streak is 3 days (got ${analytics.streakStats.bestCurrentStreak})`);
    assert(analytics.streakStats.bestLongestStreak === 3, `Best longest streak is 3 days (got ${analytics.streakStats.bestLongestStreak})`);
    assert(analytics.streakStats.bestCurrentHabitTitle === "Daily Mathematical Derivations", "Streak champion habit title identified");

    // Dimension 6 & 7: Activity Count & Duration
    console.log("\n-> Dimensions 6 & 7: Activity Count & Focus Duration");
    assert(analytics.activityStats.totalActivitiesAllTime >= 4, "Total activities count is at least 4");
    assert(analytics.activityStats.totalDurationMinutesAllTime >= 315, `Total duration is at least 315 mins (got ${analytics.activityStats.totalDurationMinutesAllTime})`);
    assert(analytics.activityStats.averageSessionMinutes > 0, `Average session duration calculated (${analytics.activityStats.averageSessionMinutes}m)`);
    assert(analytics.activityStats.sectionBreakdown.length >= 2, "Activity section breakdown contains sections");
    assert(analytics.activityStats.topTags.length >= 3, `Top tags identified (got ${analytics.activityStats.topTags.length} tags)`);
    const mathTag = analytics.activityStats.topTags.find((t) => t.tag === "math");
    assert(mathTag?.count === 2 && mathTag?.focusMinutes === 135, "Tag 'math' accurately aggregated (2 sessions, 135m)");

    // Dimension 8: Goal Progress
    console.log("\n-> Dimension 8: Goal Progress");
    assert(analytics.goalStats.totalGoals === 3, "Total goals count is 3");
    assert(analytics.goalStats.completedGoals === 1, "Completed goals count is 1");
    assert(analytics.goalStats.inProgressGoals === 1, "In-progress goals count is 1");
    assert(analytics.goalStats.pausedGoals === 1, "Paused goals count is 1");
    assert(analytics.goalStats.completionRate === 33, `Goal completion rate is 33% (${analytics.goalStats.completionRate}%)`);
    assert(analytics.goalStats.averageProgressPercentage > 0, `Average goal progress is positive (${analytics.goalStats.averageProgressPercentage}%)`);

    // Dimension 9: Active Days & Consistency
    console.log("\n-> Dimension 9: Active Days & Consistency");
    assert(analytics.activeDaysStats.activeDaysAllTime >= 4, `All-time active days count verified (got ${analytics.activeDaysStats.activeDaysAllTime})`);
    assert(analytics.activeDaysStats.activeDaysPast30Days >= 4, "Past 30 days active days verified");
    assert(analytics.activeDaysStats.activeDaysPast7Days >= 4, "Past 7 days active days verified");
    assert(analytics.activeDaysStats.consistencyScore >= 13, "Consistency score verified");

    // 4. Testing Empty User Analytics Resilience (User B)
    console.log("\n--- 4. Testing Empty User State Resilience ---");
    const emptyAnalytics = await analyticsService.getAnalytics(userB.id);
    assert(emptyAnalytics.weeklyOverview.totalTasksCompleted === 0, "Empty user has 0 tasks completed");
    assert(emptyAnalytics.weeklyOverview.totalFocusMinutes === 0, "Empty user has 0 focus minutes");
    assert(emptyAnalytics.taskStats.completionRate === 0, "Empty user task completion rate is 0% (no NaN)");
    assert(emptyAnalytics.habitStats.overallCompletionRate === 0, "Empty user habit completion rate is 0% (no NaN)");
    assert(emptyAnalytics.streakStats.bestCurrentStreak === 0, "Empty user streak is 0");
    assert(emptyAnalytics.streakStats.bestCurrentHabitTitle === null, "Empty user habit champion is null");
    assert(emptyAnalytics.activityStats.averageSessionMinutes === 0, "Empty user avg session is 0m (no NaN)");
    assert(emptyAnalytics.goalStats.completionRate === 0, "Empty user goal rate is 0% (no NaN)");
    assert(emptyAnalytics.activeDaysStats.activeDaysAllTime === 0, "Empty user has 0 active days");

    // 5. Multi-Tenant Security & Isolation
    console.log("\n--- 5. Testing Multi-Tenant Analytics Isolation ---");
    assert(emptyAnalytics.taskStats.totalTasks === 0, "User B sees 0 of User A's tasks");
    assert(emptyAnalytics.habitStats.totalHabits === 0, "User B sees 0 of User A's habits");
    assert(emptyAnalytics.activityStats.totalActivitiesAllTime === 0, "User B sees 0 of User A's activities");
    assert(emptyAnalytics.goalStats.totalGoals === 0, "User B sees 0 of User A's goals");

    // 6. E2E HTTP Endpoints
    console.log("\n--- 6. Testing E2E HTTP Endpoints ---");
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Obtain Session for User A
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const rawCsrfCookies = (csrfRes.headers.getSetCookie?.() || [csrfRes.headers.get("set-cookie") || ""]).join("; ");

    const loginResA = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: rawCsrfCookies,
      },
      body: new URLSearchParams({
        email: emailA,
        password: pass,
        csrfToken: csrfData.csrfToken,
        json: "true",
      }),
      redirect: "manual",
    });
    const sessionCookieA = (loginResA.headers.getSetCookie?.() || [loginResA.headers.get("set-cookie") || ""]).join("; ");
    assert(!!sessionCookieA, "User A authenticated with session cookie");

    // Authenticated access to /analytics page
    const analyticsPageRes = await fetch(`${baseUrl}/analytics`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(analyticsPageRes.status === 200, "GET /analytics returns 200 OK for User A");
    const analyticsPageHtml = await analyticsPageRes.text();
    assert(
      analyticsPageHtml.includes("Progress &amp; Consistency Analytics") || analyticsPageHtml.includes("Progress & Consistency Analytics") || analyticsPageHtml.includes("Analytics"),
      "Analytics page contains title heading"
    );

    // Test API: GET /api/analytics
    const apiAnalyticsRes = await fetch(`${baseUrl}/api/analytics`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(apiAnalyticsRes.status === 200, "GET /api/analytics returns 200 OK");
    const apiBody = await apiAnalyticsRes.json();
    assert(apiBody.data?.taskStats.totalTasks === 5, "API returned taskStats with 5 total tasks");
    assert(apiBody.data?.habitStats.totalHabits === 2, "API returned habitStats with 2 habits");
    assert(apiBody.data?.streakStats.bestCurrentStreak === 3, "API returned streakStats best current streak 3");
    assert(apiBody.data?.activityStats.totalActivitiesAllTime >= 4, "API returned activityStats");

    // Unauthenticated protection
    const unauthRes = await fetch(`${baseUrl}/api/analytics`);
    assert(unauthRes.status === 401, "GET /api/analytics returns 401 Unauthorized for guests");

  } finally {
    // Teardown test artifacts
    const userIds = [userA?.id, userB?.id]
      .filter(Boolean)
      .map((id) => new mongoose.Types.ObjectId(id as string));

    if (userIds.length > 0) {
      await HabitLog.deleteMany({ userId: { $in: userIds } });
      await Habit.deleteMany({ userId: { $in: userIds } });
      await Task.deleteMany({ userId: { $in: userIds } });
      await Activity.deleteMany({ userId: { $in: userIds } });
      await Goal.deleteMany({ userId: { $in: userIds } });
      await Section.deleteMany({ userId: { $in: userIds } });
    }
    await User.deleteMany({ email: { $in: [emailA, emailB] } });
  }

  console.log("\n=========================================");
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log("=========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
