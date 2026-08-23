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

async function testDashboardHttpFlow() {
  console.log("=================================================");
  console.log("     DASHBOARD & GOALS E2E HTTP TEST SUITE       ");
  console.log("=================================================\n");

  const baseUrl = "http://localhost:3000";
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

    // 1. Setup Test User
    console.log("--- 1. Setting Up Test User ---");
    const email = `ada_lovelace_${Date.now()}@example.com`;
    const pass = "Algorithm1843!";

    const user = await userService.registerUser({
      name: "Ada Lovelace",
      email,
      password: pass,
    });
    const section = await sectionService.createSection(user.id, {
      name: "Analytical Engine",
      color: "#8b5cf6",
    });

    await taskService.createTask(user.id, {
      title: "Write Bernoulli numbers algorithm",
      sectionId: section.id,
    });

    await habitService.createHabit(user.id, {
      title: "Daily Mathematical Translation",
      frequency: "daily",
      sectionId: section.id,
    });

    // 2. Authenticate
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const rawCsrfCookies = csrfRes.headers.get("set-cookie") || "";

    const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: rawCsrfCookies,
      },
      body: new URLSearchParams({
        email,
        password: pass,
        csrfToken: csrfData.csrfToken,
        json: "true",
      }),
      redirect: "manual",
    });
    const sessionCookie = (loginRes.headers.getSetCookie?.() || [loginRes.headers.get("set-cookie") || ""]).join("; ");
    assert(!!sessionCookie, "Ada Lovelace authenticated with session cookie");

    // 3. Render Dashboard Page
    console.log("\n--- 2. Testing /dashboard HTML Page Rendering ---");
    const dashPageRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { Cookie: sessionCookie },
    });
    assert(dashPageRes.status === 200, "GET /dashboard returns 200 OK");
    const dashHtml = await dashPageRes.text();

    assert(dashHtml.includes("Welcome back"), "Dashboard contains greeting");
    assert(dashHtml.includes("Ada Lovelace"), "Dashboard contains user name");
    assert(dashHtml.includes("7-Day Activity &amp; Focus Chart") || dashHtml.includes("7-Day Activity & Focus Chart"), "Dashboard contains Weekly Activity Chart");
    assert(dashHtml.includes("Today&#x27;s Tasks") || dashHtml.includes("Today's Tasks"), "Dashboard contains Today's Tasks widget");
    assert(dashHtml.includes("Habit Streaks"), "Dashboard contains Habit Streaks widget");
    assert(dashHtml.includes("Active Targets &amp; Milestones") || dashHtml.includes("Active Targets & Milestones"), "Dashboard contains Goals widget");
    assert(dashHtml.includes("Recent Activity Feed"), "Dashboard contains Recent Activity Feed");

    // 4. Goals REST API
    console.log("\n--- 3. Testing Goals REST API ---");
    const createGoalRes = await fetch(`${baseUrl}/api/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        title: "Publish Notes on Menabrea's Sketch",
        description: "Complete 7 annotations (A to G)",
        currentValue: 3,
        targetValue: 7,
        unit: "notes",
        sectionId: section.id,
      }),
    });
    assert(createGoalRes.status === 201, "POST /api/goals returns 201 Created");
    const createdGoal = (await createGoalRes.json()).data;
    assert(createdGoal?.title === "Publish Notes on Menabrea's Sketch", "Created goal title matches");
    assert(createdGoal?.progressPercentage === 43, "Progress percentage is 43% (3/7)");
    const goalId = createdGoal.id;

    // GET /api/goals
    const getGoalsRes = await fetch(`${baseUrl}/api/goals`, {
      headers: { Cookie: sessionCookie },
    });
    assert(getGoalsRes.status === 200, "GET /api/goals returns 200 OK");
    const goalsList = (await getGoalsRes.json()).data;
    assert(goalsList.length === 1, "GET /api/goals returns 1 goal");

    // PATCH /api/goals/[id]
    const patchGoalRes = await fetch(`${baseUrl}/api/goals/${goalId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        currentValue: 7,
      }),
    });
    assert(patchGoalRes.status === 200, "PATCH /api/goals/[id] returns 200 OK");
    const patchedGoal = (await patchGoalRes.json()).data;
    assert(patchedGoal?.currentValue === 7, "Goal current value updated to 7");
    assert(patchedGoal?.progressPercentage === 100, "Goal progress percentage updated to 100%");
    assert(patchedGoal?.status === "completed", "Goal status marked as completed");

    // DELETE /api/goals/[id]
    const deleteGoalRes = await fetch(`${baseUrl}/api/goals/${goalId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookie },
    });
    assert(deleteGoalRes.status === 200, "DELETE /api/goals/[id] returns 200 OK");

    // Cleanup
    await User.deleteMany({ email });
    await Section.deleteMany({});
    await Task.deleteMany({});
    await Habit.deleteMany({});
    await HabitLog.deleteMany({});
    await Activity.deleteMany({});
    await Goal.deleteMany({});
    await conn.disconnect();

    console.log("\n=================================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Dashboard E2E test execution error:", error);
    process.exit(1);
  }
}

testDashboardHttpFlow();
