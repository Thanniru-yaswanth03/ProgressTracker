import mongoose from "mongoose";
import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { Section } from "../src/models/Section";
import { Task } from "../src/models/Task";
import { Activity } from "../src/models/Activity";
import { Habit } from "../src/models/Habit";
import { HabitLog } from "../src/models/HabitLog";
import { Goal } from "../src/models/Goal";
import { formatDateKey, shiftDate } from "../src/server/services/streak.service";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, category: string, name: string, details?: any) {
  if (condition) {
    results.push({ category, name, passed: true, details });
    console.log(`✅ [${category}] PASS: ${name}`);
  } else {
    results.push({ category, name, passed: false, details, error: "Assertion failed" });
    console.error(`❌ [${category}] FAIL: ${name}`);
  }
}

async function loginUser(email: string, pass: string): Promise<string> {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const initialCookie = csrfRes.headers.get("set-cookie") || "";

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: initialCookie,
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password: pass,
      redirect: "false",
    }),
    redirect: "manual",
  });

  const sessionCookie = loginRes.headers.get("set-cookie") || "";
  const match = sessionCookie.match(/(authjs\.session-token=[^;]+|__Secure-authjs\.session-token=[^;]+)/);
  if (!match) {
    throw new Error(`Failed to extract session cookie for ${email}`);
  }
  return match[0];
}

async function runAcceptanceAudit() {
  console.log("\n========================================================================");
  console.log("       PROGRESS TRACKER — COMPREHENSIVE ACCEPTANCE AUDIT REPORT         ");
  console.log("========================================================================\n");

  await connectDB();

  // Test accounts
  const userAEmail = `audit.user.a.${Date.now()}@acceptance.test`;
  const userBEmail = `audit.user.b.${Date.now()}@acceptance.test`;
  const password = "Password123!";

  // Cleanup past audit runs
  await User.deleteMany({ email: { $regex: /@acceptance\.test$/i } });
  await Section.deleteMany({});
  await Task.deleteMany({});
  await Activity.deleteMany({});
  await Habit.deleteMany({});
  await HabitLog.deleteMany({});
  await Goal.deleteMany({});

  // -------------------------------------------------------------------------
  // 1. AUTHENTICATION FLOW
  // -------------------------------------------------------------------------
  console.log("\n--- 1. AUTHENTICATION FLOW ---");

  // 1.1 Register User A
  const bcrypt = await import("bcryptjs");
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const userA = await User.create({
    name: "Alex Mercer",
    email: userAEmail,
    passwordHash,
  });
  assert(!!userA._id, "AUTH", "User A registered successfully in persistent DB");

  // 1.2 Log in User A
  let userACookie = await loginUser(userAEmail, password);
  assert(!!userACookie, "AUTH", "User A logs in & receives NextAuth session cookie");

  // 1.3 Verify authenticated session
  const dashAuthRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Cookie: userACookie },
  });
  assert(dashAuthRes.status === 200, "AUTH", "Authenticated user accesses /dashboard (200 OK)");

  // 1.4 Verify protected routes reject unauthenticated requests
  const protectedPaths = ["/dashboard", "/sections", "/tasks", "/habits", "/activities", "/goals", "/history", "/analytics"];
  for (const path of protectedPaths) {
    const unauthRes = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
    const isProtected = unauthRes.status === 307 || unauthRes.status === 302 || unauthRes.status === 401;
    assert(isProtected, "AUTH", `Unauthenticated request to ${path} is blocked/redirected (status: ${unauthRes.status})`);
  }

  // 1.5 Verify protected API routes reject unauthenticated requests
  const protectedApis = ["/api/sections", "/api/tasks", "/api/habits", "/api/activities", "/api/goals", "/api/history/day", "/api/analytics"];
  for (const apiPath of protectedApis) {
    const unauthApiRes = await fetch(`${BASE_URL}${apiPath}`);
    assert(unauthApiRes.status === 401, "AUTH", `Unauthenticated request to ${apiPath} returns 401 Unauthorized`);
  }

  // 1.6 Log back in and verify session persistence
  userACookie = await loginUser(userAEmail, password);
  const reauthDashRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Cookie: userACookie },
  });
  assert(reauthDashRes.status === 200, "AUTH", "Session persists and allows re-entry to /dashboard");

  // -------------------------------------------------------------------------
  // 2. SECTIONS FLOW
  // -------------------------------------------------------------------------
  console.log("\n--- 2. SECTIONS FLOW ---");

  // 2.1 Create Section 1
  const createSec1Res = await fetch(`${BASE_URL}/api/sections`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({ name: "Quantum Computing", color: "#6366f1", description: "Hardware & Algorithms" }),
  });
  assert(createSec1Res.status === 201, "SECTIONS", "Create Section 1 returns 201 Created");
  const sec1Data = await createSec1Res.json();
  const sec1Id = sec1Data.data.id;
  assert(sec1Data.data.name === "Quantum Computing", "SECTIONS", "Section 1 name persisted accurately");

  // 2.2 Edit Section 1
  const updateSec1Res = await fetch(`${BASE_URL}/api/sections/${sec1Id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({ name: "Advanced Quantum Computing", color: "#10b981", description: "Qubits and Fault Tolerance" }),
  });
  assert(updateSec1Res.status === 200, "SECTIONS", "Edit Section 1 returns 200 OK");
  const updatedSec1Data = await updateSec1Res.json();
  assert(updatedSec1Data.data.name === "Advanced Quantum Computing", "SECTIONS", "Section 1 renamed accurately");
  assert(updatedSec1Data.data.color === "#10b981", "SECTIONS", "Section 1 color updated to Emerald");

  // 2.3 Open Section detail
  const getSec1Res = await fetch(`${BASE_URL}/api/sections/${sec1Id}`, {
    headers: { Cookie: userACookie },
  });
  assert(getSec1Res.status === 200, "SECTIONS", "Open Section detail returns 200 OK");

  // 2.4 Create Section 2 and then Delete it
  const createSec2Res = await fetch(`${BASE_URL}/api/sections`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({ name: "Neuroscience Lab", color: "#ec4899" }),
  });
  const sec2Data = await createSec2Res.json();
  const sec2Id = sec2Data.data.id;

  const deleteSec2Res = await fetch(`${BASE_URL}/api/sections/${sec2Id}`, {
    method: "DELETE",
    headers: { Cookie: userACookie },
  });
  assert(deleteSec2Res.status === 200, "SECTIONS", "Delete Section 2 returns 200 OK");

  // 2.5 Refresh list and verify persistence
  const listSecRes = await fetch(`${BASE_URL}/api/sections`, {
    headers: { Cookie: userACookie },
  });
  const secList = await listSecRes.json();
  assert(secList.data.length === 1, "SECTIONS", "Section list has exactly 1 section (Section 2 deleted)");
  assert(secList.data[0].id === sec1Id, "SECTIONS", "Remaining section is Section 1");

  // -------------------------------------------------------------------------
  // 3. TASKS FLOW
  // -------------------------------------------------------------------------
  console.log("\n--- 3. TASKS FLOW ---");

  // 3.1 Create Tasks
  const createTask1Res = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({
      title: "Build Superconducting Circuit",
      description: "Cryogenic dilution refrigerator setup",
      priority: "urgent",
      sectionId: sec1Id,
    }),
  });
  assert(createTask1Res.status === 201, "TASKS", "Create Task 1 returns 201 Created");
  const task1Data = await createTask1Res.json();
  const task1Id = task1Data.data.id;

  const createTask2Res = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({
      title: "Review Shor's Algorithm",
      priority: "high",
    }),
  });
  const task2Data = await createTask2Res.json();
  const task2Id = task2Data.data.id;

  // 3.2 Edit Task 1
  const updateTask1Res = await fetch(`${BASE_URL}/api/tasks/${task1Id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({
      title: "Build Fault-Tolerant Circuit",
      description: "Cryogenic surface code lattice setup",
    }),
  });
  assert(updateTask1Res.status === 200, "TASKS", "Edit Task 1 returns 200 OK");
  const updatedTask1 = await updateTask1Res.json();
  assert(updatedTask1.data.title === "Build Fault-Tolerant Circuit", "TASKS", "Task 1 title updated in database");

  // 3.3 Complete Task 1
  const completeTask1Res = await fetch(`${BASE_URL}/api/tasks/${task1Id}/toggle`, {
    method: "POST",
    headers: { Cookie: userACookie },
  });
  assert(completeTask1Res.status === 200, "TASKS", "Toggle Task 1 complete returns 200 OK");
  const completedTask1 = await completeTask1Res.json();
  assert(completedTask1.data.status === "completed", "TASKS", "Task 1 status changed to 'completed'");
  assert(!!completedTask1.data.completedAt, "TASKS", "Task 1 completedAt timestamp recorded");

  // Check auto-activity log for completed task
  const autoAct = await Activity.findOne({ refId: task1Id, type: "task_completed" });
  assert(!!autoAct, "TASKS", "Auto-activity log generated for completed task");

  // 3.4 Reopen Task 1
  const reopenTask1Res = await fetch(`${BASE_URL}/api/tasks/${task1Id}/toggle`, {
    method: "POST",
    headers: { Cookie: userACookie },
  });
  assert(reopenTask1Res.status === 200, "TASKS", "Toggle Task 1 reopen returns 200 OK");
  const reopenedTask1 = await reopenTask1Res.json();
  assert(reopenedTask1.data.status === "pending", "TASKS", "Task 1 status reverted to 'pending'");
  assert(!reopenedTask1.data.completedAt, "TASKS", "Task 1 completedAt cleared");

  const cleanedAutoAct = await Activity.findOne({ refId: task1Id, type: "task_completed" });
  assert(!cleanedAutoAct, "TASKS", "Auto-activity log cleanly removed upon task reopening");

  // Complete Task 1 again for subsequent analytics test
  await fetch(`${BASE_URL}/api/tasks/${task1Id}/toggle`, { method: "POST", headers: { Cookie: userACookie } });

  // 3.5 Delete Task 2
  const deleteT2Res = await fetch(`${BASE_URL}/api/tasks/${task2Id}`, {
    method: "DELETE",
    headers: { Cookie: userACookie },
  });
  assert(deleteT2Res.status === 200, "TASKS", "Delete Task 2 returns 200 OK");

  // 3.6 Verify persistence after refresh
  const tasksListRes = await fetch(`${BASE_URL}/api/tasks`, { headers: { Cookie: userACookie } });
  const tasksList = await tasksListRes.json();
  assert(tasksList.data.length === 1, "TASKS", "Task list contains exactly 1 task");
  assert(tasksList.data[0].id === task1Id, "TASKS", "Remaining task is Task 1");

  // -------------------------------------------------------------------------
  // 4. ACTIVITIES FLOW
  // -------------------------------------------------------------------------
  console.log("\n--- 4. ACTIVITIES FLOW ---");

  // 4.1 Create Activity
  const createActRes = await fetch(`${BASE_URL}/api/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({
      title: "Quantum Teleportation Experiment",
      description: "Bell state entanglement measurement",
      duration: 75,
      tags: ["quantum", "physics"],
      sectionId: sec1Id,
    }),
  });
  assert(createActRes.status === 201, "ACTIVITIES", "Create Activity returns 201 Created");
  const actData = await createActRes.json();
  const act1Id = actData.data.id;
  assert(actData.data.duration === 75, "ACTIVITIES", "Activity duration persisted as 75 mins");
  assert(actData.data.tags.includes("quantum"), "ACTIVITIES", "Activity tags persisted accurately");

  // 4.2 Verify in history / timeline
  const listActRes = await fetch(`${BASE_URL}/api/activities`, { headers: { Cookie: userACookie } });
  const actList = await listActRes.json();
  assert(actList.data.some((a: any) => a.id === act1Id), "ACTIVITIES", "Activity appears in activity timeline");

  // 4.3 Log out and back in, verify persistence
  userACookie = await loginUser(userAEmail, password);
  const reloadActRes = await fetch(`${BASE_URL}/api/activities/${act1Id}`, { headers: { Cookie: userACookie } });
  assert(reloadActRes.status === 200, "ACTIVITIES", "Activity persists across logout & login");

  // -------------------------------------------------------------------------
  // 5. HABITS & STREAKS FLOW
  // -------------------------------------------------------------------------
  console.log("\n--- 5. HABITS & STREAKS FLOW ---");

  const todayStr = formatDateKey(new Date());
  const yesterdayStr = shiftDate(todayStr, -1);

  // 5.1 Create Habit
  const createHabitRes = await fetch(`${BASE_URL}/api/habits`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({
      title: "Daily Qubit Calibration",
      description: "Microwave pulse tune-up",
      frequency: "daily",
      sectionId: sec1Id,
    }),
  });
  assert(createHabitRes.status === 201, "HABITS", "Create Habit returns 201 Created");
  const habitData = await createHabitRes.json();
  const habit1Id = habitData.data.id;
  assert(habitData.data.streak.currentStreak === 0, "HABITS", "Initial streak starts at 0");

  // 5.2 Complete today's habit
  const logTodayRes = await fetch(`${BASE_URL}/api/habits/${habit1Id}/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({ date: todayStr }),
  });
  assert(logTodayRes.status === 200, "HABITS", "Check in today's habit returns 200 OK");
  const loggedTodayData = await logTodayRes.json();
  assert(loggedTodayData.data.completed === true, "HABITS", "Check-in completed is true");
  assert(loggedTodayData.data.habit.streak.currentStreak === 1, "HABITS", "Current streak increments to 1");

  // 5.3 Complete yesterday's habit to test consecutive progression
  const logYestRes = await fetch(`${BASE_URL}/api/habits/${habit1Id}/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({ date: yesterdayStr }),
  });
  assert(logYestRes.status === 200, "HABITS", "Check in yesterday's habit returns 200 OK");
  const loggedYestData = await logYestRes.json();
  assert(loggedYestData.data.habit.streak.currentStreak === 2, "HABITS", "Streak progresses to 2 consecutive days");

  // 5.4 Test duplicate prevention
  const logDuplicateAttempt = await fetch(`${BASE_URL}/api/habits/${habit1Id}/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({ date: todayStr }),
  });
  assert(logDuplicateAttempt.status === 200, "HABITS", "Duplicate check-in handled idempotently (toggle behavior)");
  // Toggle back to completed for today
  await fetch(`${BASE_URL}/api/habits/${habit1Id}/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({ date: todayStr }),
  });

  const logsCount = await HabitLog.countDocuments({ habitId: habit1Id, date: todayStr });
  assert(logsCount === 1, "HABITS", "Exactly one habit log exists for today in MongoDB");

  // -------------------------------------------------------------------------
  // 6. GOALS FLOW
  // -------------------------------------------------------------------------
  console.log("\n--- 6. GOALS FLOW ---");

  // 6.1 Create Goal
  const createGoalRes = await fetch(`${BASE_URL}/api/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({
      title: "Publish 10 Quantum Papers",
      description: "Peer-reviewed publications in IEEE/Nature",
      targetValue: 10,
      currentValue: 0,
      unit: "papers",
      sectionId: sec1Id,
    }),
  });
  assert(createGoalRes.status === 201, "GOALS", "Create Goal returns 201 Created");
  const goalData = await createGoalRes.json();
  const goal1Id = goalData.data.id;
  assert(goalData.data.progressPercentage === 0, "GOALS", "Initial goal progress is 0%");

  // 6.2 Update progress
  const progressRes = await fetch(`${BASE_URL}/api/goals/${goal1Id}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({ progress: 3 }),
  });
  assert(progressRes.status === 200, "GOALS", "Update progress (+3) returns 200 OK");
  const progData = await progressRes.json();
  assert(progData.data.currentValue === 3, "GOALS", "Current value is 3");
  assert(progData.data.progressPercentage === 30, "GOALS", "Progress percentage is 30% (3/10)");

  // 6.3 Pause goal
  const pauseRes = await fetch(`${BASE_URL}/api/goals/${goal1Id}/pause`, {
    method: "POST",
    headers: { Cookie: userACookie },
  });
  assert(pauseRes.status === 200, "GOALS", "Pause goal returns 200 OK");
  const pauseData = await pauseRes.json();
  assert(pauseData.data.status === "paused", "GOALS", "Goal status updated to 'paused'");

  // 6.4 Resume goal
  const resumeRes = await fetch(`${BASE_URL}/api/goals/${goal1Id}/pause`, {
    method: "POST",
    headers: { Cookie: userACookie },
  });
  assert(resumeRes.status === 200, "GOALS", "Resume goal returns 200 OK");
  const resumeData = await resumeRes.json();
  assert(resumeData.data.status === "in_progress", "GOALS", "Goal status restored to 'in_progress'");

  // 6.5 Complete goal
  const completeGoalRes = await fetch(`${BASE_URL}/api/goals/${goal1Id}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userACookie },
    body: JSON.stringify({ progress: 10 }),
  });
  assert(completeGoalRes.status === 200, "GOALS", "Update progress to 10/10 returns 200 OK");
  const completeGoalData = await completeGoalRes.json();
  assert(completeGoalData.data.status === "completed", "GOALS", "Goal auto-completes when progress reaches 100%");
  assert(completeGoalData.data.progressPercentage === 100, "GOALS", "Progress percentage is 100%");

  // -------------------------------------------------------------------------
  // 7. HISTORY & CALENDAR FLOW
  // -------------------------------------------------------------------------
  console.log("\n--- 7. HISTORY & CALENDAR FLOW ---");

  // 7.1 Inspect today's history
  const historyTodayRes = await fetch(`${BASE_URL}/api/history/day?date=${todayStr}`, {
    headers: { Cookie: userACookie },
  });
  assert(historyTodayRes.status === 200, "HISTORY", "GET /api/history/day for today returns 200 OK");
  const historyToday = await historyTodayRes.json();
  assert(historyToday.data.tasksCompleted.length === 1, "HISTORY", "Today history contains 1 completed task");
  assert(historyToday.data.habitsCompleted.length === 1, "HISTORY", "Today history contains 1 completed habit");
  assert(historyToday.data.totalFocusMinutes >= 75, "HISTORY", "Today history contains at least 75 focus minutes");
  assert(historyToday.data.dailyCompletionRate === 100, "HISTORY", "Today daily completion rate calculated as 100%");

  // 7.2 Inspect yesterday's history
  const historyYestRes = await fetch(`${BASE_URL}/api/history/day?date=${yesterdayStr}`, {
    headers: { Cookie: userACookie },
  });
  assert(historyYestRes.status === 200, "HISTORY", "GET /api/history/day for yesterday returns 200 OK");
  const historyYest = await historyYestRes.json();
  assert(historyYest.data.habitsCompleted.length === 1, "HISTORY", "Yesterday history contains 1 completed habit");

  // 7.3 Inspect monthly calendar aggregation
  const currentYearMonth = todayStr.substring(0, 7);
  const historyMonthRes = await fetch(`${BASE_URL}/api/history/month?month=${currentYearMonth}`, {
    headers: { Cookie: userACookie },
  });
  assert(historyMonthRes.status === 200, "HISTORY", "GET /api/history/month returns 200 OK");
  const historyMonth = await historyMonthRes.json();
  assert(historyMonth.data.days.length >= 28, "HISTORY", "Month history contains all days of the month");
  assert(historyMonth.data.activeDaysCount >= 2, "HISTORY", "Total active days count calculated accurately (>=2 days)");

  // -------------------------------------------------------------------------
  // 8. ANALYTICS VERIFICATION (MANUAL MATH AUDIT)
  // -------------------------------------------------------------------------
  console.log("\n--- 8. ANALYTICS VERIFICATION (MANUAL MATH AUDIT) ---");

  // Expected values from User A's real data:
  // - Total tasks: 1 (completed: 1, pending: 0) -> completionRate: 100%
  // - Task priority: 1 urgent
  // - Habit: 1 habit, streak: 2
  // - Activity duration: 75 mins total, 1 manual activity (+ auto activity for completed task)
  // - Goals: 1 goal completed (100%)
  const analyticsRes = await fetch(`${BASE_URL}/api/analytics`, {
    headers: { Cookie: userACookie },
  });
  assert(analyticsRes.status === 200, "ANALYTICS", "GET /api/analytics returns 200 OK");
  const analyticsData = await analyticsRes.json();
  const a = analyticsData.data;

  assert(a.taskStats.totalTasks === 1, "ANALYTICS", "Task stats totalTasks = 1 (Expected: 1)");
  assert(a.taskStats.completedTasks === 1, "ANALYTICS", "Task stats completedTasks = 1 (Expected: 1)");
  assert(a.taskStats.completionRate === 100, "ANALYTICS", "Task completion rate = 100% (Expected: 100%)");
  
  const urgentBreakdown = a.taskStats.priorityBreakdown.find((p: any) => p.priority === "urgent");
  assert(urgentBreakdown?.total === 1, "ANALYTICS", "Urgent priority task breakdown = 1 (Expected: 1)");

  assert(a.streakStats.bestCurrentStreak === 2, "ANALYTICS", "Best current streak = 2 (Expected: 2)");
  assert(a.streakStats.bestLongestStreak === 2, "ANALYTICS", "Best longest streak = 2 (Expected: 2)");

  assert(a.activityStats.totalDurationMinutesAllTime === 75, "ANALYTICS", "Total focus minutes = 75 (Expected: 75)");
  assert(a.goalStats.completedGoals === 1, "ANALYTICS", "Goal stats completedGoals = 1 (Expected: 1)");
  assert(a.goalStats.completionRate === 100, "ANALYTICS", "Goal milestone completion rate = 100% (Expected: 100%)");
  assert(a.activeDaysStats.activeDaysPast7Days >= 2, "ANALYTICS", "Active days past 7 days >= 2 (Expected: >= 2)");

  // -------------------------------------------------------------------------
  // 9. MULTI-TENANT SECURITY & IDOR ATTACK AUDIT
  // -------------------------------------------------------------------------
  console.log("\n--- 9. MULTI-TENANT SECURITY & IDOR ATTACK AUDIT ---");

  // 9.1 Register User B
  const userB = await User.create({
    name: "Beatrice Hall",
    email: userBEmail,
    passwordHash,
  });
  const userBCookie = await loginUser(userBEmail, password);
  assert(!!userBCookie, "SECURITY", "User B authenticated with independent session cookie");

  // 9.2 Verify User B sees empty data across all domains
  const bTasksRes = await fetch(`${BASE_URL}/api/tasks`, { headers: { Cookie: userBCookie } });
  const bTasks = await bTasksRes.json();
  assert(bTasks.data.length === 0, "SECURITY", "User B sees 0 tasks (No leakage from User A)");

  const bSecsRes = await fetch(`${BASE_URL}/api/sections`, { headers: { Cookie: userBCookie } });
  const bSecs = await bSecsRes.json();
  assert(bSecs.data.length === 0, "SECURITY", "User B sees 0 sections (No leakage from User A)");

  const bHabitsRes = await fetch(`${BASE_URL}/api/habits`, { headers: { Cookie: userBCookie } });
  const bHabits = await bHabitsRes.json();
  assert(bHabits.data.length === 0, "SECURITY", "User B sees 0 habits (No leakage from User A)");

  const bActsRes = await fetch(`${BASE_URL}/api/activities`, { headers: { Cookie: userBCookie } });
  const bActs = await bActsRes.json();
  assert(bActs.data.length === 0, "SECURITY", "User B sees 0 activities (No leakage from User A)");

  const bGoalsRes = await fetch(`${BASE_URL}/api/goals`, { headers: { Cookie: userBCookie } });
  const bGoals = await bGoalsRes.json();
  assert(bGoals.data.length === 0, "SECURITY", "User B sees 0 goals (No leakage from User A)");

  const bAnalyticsRes = await fetch(`${BASE_URL}/api/analytics`, { headers: { Cookie: userBCookie } });
  const bAnalytics = await bAnalyticsRes.json();
  assert(bAnalytics.data.taskStats.totalTasks === 0, "SECURITY", "User B analytics totalTasks = 0 (No leakage)");
  assert(bAnalytics.data.activityStats.totalDurationMinutesAllTime === 0, "SECURITY", "User B analytics focus = 0 mins (No leakage)");

  // 9.3 Direct IDOR Attacks by User B on User A's resources
  // Attack 1: User B tries to read User A's section
  const idorSecGet = await fetch(`${BASE_URL}/api/sections/${sec1Id}`, { headers: { Cookie: userBCookie } });
  assert(idorSecGet.status === 404, "SECURITY", "IDOR Blocked: User B cannot GET User A's section (404 Not Found)");

  // Attack 2: User B tries to modify User A's section
  const idorSecPatch = await fetch(`${BASE_URL}/api/sections/${sec1Id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: userBCookie },
    body: JSON.stringify({ name: "Hacked by User B" }),
  });
  assert(idorSecPatch.status === 404, "SECURITY", "IDOR Blocked: User B cannot PATCH User A's section (404 Not Found)");

  // Attack 3: User B tries to delete User A's section
  const idorSecDel = await fetch(`${BASE_URL}/api/sections/${sec1Id}`, {
    method: "DELETE",
    headers: { Cookie: userBCookie },
  });
  assert(idorSecDel.status === 404, "SECURITY", "IDOR Blocked: User B cannot DELETE User A's section (404 Not Found)");

  // Attack 4: User B tries to read User A's task
  const idorTaskGet = await fetch(`${BASE_URL}/api/tasks/${task1Id}`, { headers: { Cookie: userBCookie } });
  assert(idorTaskGet.status === 404, "SECURITY", "IDOR Blocked: User B cannot GET User A's task (404 Not Found)");

  // Attack 5: User B tries to toggle User A's task
  const idorTaskToggle = await fetch(`${BASE_URL}/api/tasks/${task1Id}/toggle`, {
    method: "POST",
    headers: { Cookie: userBCookie },
  });
  assert(idorTaskToggle.status === 404, "SECURITY", "IDOR Blocked: User B cannot toggle User A's task (404 Not Found)");

  // Attack 6: User B tries to read User A's habit
  const idorHabitGet = await fetch(`${BASE_URL}/api/habits/${habit1Id}`, { headers: { Cookie: userBCookie } });
  assert(idorHabitGet.status === 404, "SECURITY", "IDOR Blocked: User B cannot GET User A's habit (404 Not Found)");

  // Attack 7: User B tries to log check-in on User A's habit
  const idorHabitLog = await fetch(`${BASE_URL}/api/habits/${habit1Id}/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userBCookie },
    body: JSON.stringify({ date: todayStr }),
  });
  assert(idorHabitLog.status === 404, "SECURITY", "IDOR Blocked: User B cannot log check-in on User A's habit (404 Not Found)");

  // Attack 8: User B tries to read User A's goal
  const idorGoalGet = await fetch(`${BASE_URL}/api/goals/${goal1Id}`, { headers: { Cookie: userBCookie } });
  assert(idorGoalGet.status === 404, "SECURITY", "IDOR Blocked: User B cannot GET User A's goal (404 Not Found)");

  // Attack 9: User B tries to update User A's goal progress
  const idorGoalProg = await fetch(`${BASE_URL}/api/goals/${goal1Id}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userBCookie },
    body: JSON.stringify({ progress: 1 }),
  });
  assert(idorGoalProg.status === 404, "SECURITY", "IDOR Blocked: User B cannot update User A's goal (404 Not Found)");

  // Attack 10: User B tries to inject User A's section into User B's new task
  const crossSectionTask = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userBCookie },
    body: JSON.stringify({ title: "Injected Task", sectionId: sec1Id }),
  });
  assert(crossSectionTask.status === 400, "SECURITY", "Cross-tenant section injection into Task rejected (400 Bad Request)");

  // Attack 11: User B tries to inject User A's section into User B's new habit
  const crossSectionHabit = await fetch(`${BASE_URL}/api/habits`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userBCookie },
    body: JSON.stringify({ title: "Injected Habit", sectionId: sec1Id }),
  });
  assert(crossSectionHabit.status === 400, "SECURITY", "Cross-tenant section injection into Habit rejected (400 Bad Request)");

  // Attack 12: User B tries to inject User A's section into User B's new goal
  const crossSectionGoal = await fetch(`${BASE_URL}/api/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: userBCookie },
    body: JSON.stringify({ title: "Injected Goal", sectionId: sec1Id, targetValue: 10 }),
  });
  assert(crossSectionGoal.status === 400, "SECURITY", "Cross-tenant section injection into Goal rejected (400 Bad Request)");

  // Cleanup test users
  await User.deleteMany({ email: { $regex: /@acceptance\.test$/i } });
  await Section.deleteMany({});
  await Task.deleteMany({});
  await Activity.deleteMany({});
  await Habit.deleteMany({});
  await HabitLog.deleteMany({});
  await Goal.deleteMany({});

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n========================================================================");
  console.log(`AUDIT COMPLETE: ${passed} / ${total} Checks Passed (${failed} Failed)`);
  console.log("========================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceAudit().catch((err) => {
  console.error("Fatal acceptance audit error:", err);
  process.exit(1);
});
