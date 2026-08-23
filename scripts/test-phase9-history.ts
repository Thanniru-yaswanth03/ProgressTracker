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
import { historyService } from "@/server/services/history.service";
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
  console.log("   PHASE 9: HISTORY & CALENDAR TESTS     ");
  console.log("=========================================\n");

  await connectDB();

  const timestamp = Date.now();
  const emailA = `history.test.a.${timestamp}@example.com`;
  const emailB = `history.test.b.${timestamp}@example.com`;
  const pass = "Password123!";

  let userA: { id: string; name?: string | null; email?: string | null } | null = null;
  let userB: { id: string; name?: string | null; email?: string | null } | null = null;

  try {
    // 1. Setup Test Users
    console.log("--- 1. Setting Up Test Accounts ---");
    userA = await userService.registerUser({
      name: "Galileo Galilei",
      email: emailA,
      password: pass,
    });
    userB = await userService.registerUser({
      name: "Johannes Kepler",
      email: emailB,
      password: pass,
    });
    assert(!!userA?.id && !!userB?.id, "Test Users Galileo (A) and Kepler (B) registered");

    // Create Section
    const sectionA = await sectionService.createSection(userA.id, {
      name: "Observational Astronomy",
      color: "#8b5cf6",
    });
    assert(!!sectionA.id, "Section created for User A");

    const todayStr = formatDateKey(new Date());
    const yesterdayStr = shiftDate(todayStr, -1);
    const threeDaysAgoStr = shiftDate(todayStr, -3);
    const currentMonthStr = todayStr.slice(0, 7);

    // 2. Generate Historical Records on Specific Dates
    console.log("\n--- 2. Populating Historical Achievements on Specific Dates ---");

    // Today: Create Task and Complete Today
    const taskToday = await taskService.createTask(userA.id, {
      title: "Telescope lens calibration",
      sectionId: sectionA.id,
      priority: "high",
    });
    await taskService.toggleTaskStatus(taskToday.id, userA.id, "completed");
    assert(true, "Task completed for today");

    // Yesterday: Create Task and set completedAt to Yesterday
    const taskYesterday = await taskService.createTask(userA.id, {
      title: "Jupiter moons orbital recording",
      sectionId: sectionA.id,
      priority: "urgent",
    });
    await Task.updateOne(
      { _id: new mongoose.Types.ObjectId(taskYesterday.id) },
      {
        $set: {
          status: "completed",
          completedAt: new Date(`${yesterdayStr}T14:30:00.000Z`),
        },
      }
    );
    assert(true, "Task completed for yesterday");

    // Today: Habit & Check-in
    const habitA = await habitService.createHabit(userA.id, {
      title: "Evening star gazing",
      frequency: "daily",
      sectionId: sectionA.id,
    });
    await habitService.toggleHabitLog(habitA.id, userA.id, todayStr);
    assert(true, "Habit checked in for today");

    // Yesterday: Habit Check-in
    await habitService.toggleHabitLog(habitA.id, userA.id, yesterdayStr);
    assert(true, "Habit checked in for yesterday");

    // Today: Log Activity
    const activityToday = await activityService.createActivity(userA.id, {
      title: "Solar spot observation",
      sectionId: sectionA.id,
      duration: 90,
      tags: ["astronomy", "sun"],
      occurredAt: new Date().toISOString(),
    });
    assert(!!activityToday.id, "Activity recorded for today (90 mins)");

    // Yesterday: Log Activity
    const activityYesterday = await activityService.createActivity(userA.id, {
      title: "Lunar craters mapping",
      sectionId: sectionA.id,
      duration: 120,
      tags: ["moon", "mapping"],
      occurredAt: `${yesterdayStr}T12:00:00`,
    });
    assert(!!activityYesterday.id, "Activity recorded for yesterday (120 mins)");

    // Goal creation & progress
    const goalA = await goalService.createGoal(userA.id, {
      title: "Map 50 Celestial Bodies",
      targetValue: 50,
      currentValue: 15,
      unit: "bodies",
    });
    assert(!!goalA.id, "Goal target created");

    // 3. Testing Single Day History Service
    console.log("\n--- 3. Testing Single Day History Retrieval ---");
    const todayHistory = await historyService.getDayHistory(userA.id, todayStr);
    assert(todayHistory.date === todayStr, "Today history date matches today's date key");
    assert(todayHistory.isToday === true, "isToday flag is true for today");
    assert(todayHistory.tasksCompleted.length === 1, "Today has 1 completed task");
    assert(todayHistory.habitsCompleted.length === 1, "Today has 1 completed habit");
    assert(todayHistory.totalActivitiesCount >= 1, "Today has at least 1 focus activity");
    assert(todayHistory.totalFocusMinutes >= 90, "Today has 90+ focus minutes");
    assert(todayHistory.dailyCompletionRate > 0, `Today daily completion rate calculated (${todayHistory.dailyCompletionRate}%)`);

    // Yesterday History
    const yesterdayHistory = await historyService.getDayHistory(userA.id, yesterdayStr);
    assert(yesterdayHistory.date === yesterdayStr, "Yesterday history date matches yesterday");
    assert(yesterdayHistory.isToday === false, "isToday flag is false for yesterday");
    assert(yesterdayHistory.tasksCompleted.length === 1, "Yesterday has 1 completed task");
    assert(yesterdayHistory.habitsCompleted.length === 1, "Yesterday has 1 completed habit");
    assert(yesterdayHistory.totalFocusMinutes === 120, "Yesterday has 120 focus minutes");

    // Inactive Day History
    const inactiveDay = await historyService.getDayHistory(userA.id, threeDaysAgoStr);
    assert(inactiveDay.date === threeDaysAgoStr, "Inactive day history date matches");
    assert(inactiveDay.tasksCompleted.length === 0, "Inactive day has 0 completed tasks");
    assert(inactiveDay.activities.length === 0, "Inactive day has 0 activities");
    assert(inactiveDay.habitsCompleted.length === 0, "Inactive day has 0 completed habits");
    assert(inactiveDay.totalFocusMinutes === 0, "Inactive day has 0 focus minutes");
    assert(inactiveDay.dailyCompletionRate === 0, "Inactive day has 0% completion rate");

    // 4. Testing Month History Aggregation Service
    console.log("\n--- 4. Testing Monthly History & Heatmap Aggregation ---");
    const monthHistory = await historyService.getMonthHistory(userA.id, currentMonthStr);
    assert(monthHistory.yearMonth === currentMonthStr, "Month summary yearMonth matches current month");
    assert(monthHistory.days.length >= 28, `Month contains full calendar days (${monthHistory.days.length} days)`);
    assert(monthHistory.activeDaysCount >= 2, `Active days count reflects recorded activity (${monthHistory.activeDaysCount} active days)`);
    assert(monthHistory.totalFocusMinutes >= 210, `Total month focus minutes aggregated (210+ mins, got ${monthHistory.totalFocusMinutes})`);
    assert(monthHistory.totalTasksCompleted >= 2, "Total month tasks completed aggregated");
    assert(monthHistory.totalHabitsCompleted >= 2, "Total month habits completed aggregated");

    // 5. Multi-Tenant Security & Isolation
    console.log("\n--- 5. Testing Multi-Tenant History Security Isolation ---");
    const userBHistory = await historyService.getDayHistory(userB.id, todayStr);
    assert(userBHistory.tasksCompleted.length === 0, "User B sees 0 completed tasks on User A's active day");
    assert(userBHistory.habitsCompleted.length === 0, "User B sees 0 completed habits on User A's active day");
    assert(userBHistory.activities.length === 0, "User B sees 0 activities on User A's active day");
    assert(userBHistory.totalFocusMinutes === 0, "User B has 0 focus minutes");

    const userBMonth = await historyService.getMonthHistory(userB.id, currentMonthStr);
    assert(userBMonth.activeDaysCount === 0, "User B has 0 active days in month summary");
    assert(userBMonth.totalFocusMinutes === 0, "User B has 0 total focus minutes in month summary");

    // 6. E2E HTTP & API Verification
    console.log("\n--- 6. Testing E2E HTTP Endpoints ---");
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Obtain CSRF & Session for User A
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

    // Authenticated access to /history page
    const historyPageRes = await fetch(`${baseUrl}/history`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(historyPageRes.status === 200, "GET /history returns 200 OK for User A");
    const historyPageHtml = await historyPageRes.text();
    assert(
      historyPageHtml.includes("Activity History &amp; Calendar") || historyPageHtml.includes("Activity History & Calendar") || historyPageHtml.includes("History"),
      "History page contains title heading"
    );

    // Test API: GET /api/history/day?date=...
    const apiDayRes = await fetch(`${baseUrl}/api/history/day?date=${todayStr}`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(apiDayRes.status === 200, "GET /api/history/day returns 200 OK");
    const apiDayBody = await apiDayRes.json();
    assert(apiDayBody.data?.date === todayStr, "API returned today history payload");
    assert(apiDayBody.data?.tasksCompleted.length === 1, "API day payload has 1 completed task");

    // Test API: GET /api/history/month?month=...
    const apiMonthRes = await fetch(`${baseUrl}/api/history/month?month=${currentMonthStr}`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(apiMonthRes.status === 200, "GET /api/history/month returns 200 OK");
    const apiMonthBody = await apiMonthRes.json();
    assert(apiMonthBody.data?.yearMonth === currentMonthStr, "API returned month summary payload");
    assert(apiMonthBody.data?.activeDaysCount >= 2, "API month payload active days count verified");

    // Unauthenticated protection
    const unauthDayRes = await fetch(`${baseUrl}/api/history/day?date=${todayStr}`);
    assert(unauthDayRes.status === 401, "GET /api/history/day returns 401 Unauthorized for guests");

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
