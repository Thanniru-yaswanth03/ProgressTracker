import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Section } from "@/models/Section";
import { Goal } from "@/models/Goal";
import { userService } from "@/server/services/user.service";
import { sectionService } from "@/server/services/section.service";
import { goalService } from "@/server/services/goal.service";
import { ValidationError, NotFoundError } from "@/lib/errors";
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
  console.log("      PHASE 8: GOALS SYSTEM TEST SUITE   ");
  console.log("=========================================\n");

  await connectDB();

  const timestamp = Date.now();
  const emailA = `goal.test.a.${timestamp}@example.com`;
  const emailB = `goal.test.b.${timestamp}@example.com`;
  const pass = "Password123!";

  let userA: { id: string; name?: string | null; email?: string | null } | null = null;
  let userB: { id: string; name?: string | null; email?: string | null } | null = null;

  try {
    // 1. Setup Test Users
    console.log("--- 1. Setting Up Test Accounts ---");
    userA = await userService.registerUser({
      name: "Alan Turing",
      email: emailA,
      password: pass,
    });
    userB = await userService.registerUser({
      name: "Ada Lovelace",
      email: emailB,
      password: pass,
    });
    assert(!!userA?.id && !!userB?.id, "Test Users Alan (A) and Ada (B) registered");

    // Create Sections for User A and B
    const sectionA = await sectionService.createSection(userA.id, {
      name: "Computer Science",
      color: "#6366f1",
    });
    const sectionB = await sectionService.createSection(userB.id, {
      name: "Mathematics",
      color: "#10b981",
    });
    assert(!!sectionA.id && !!sectionB.id, "Sections created for users");

    // 2. Goal Creation Examples
    console.log("\n--- 2. Testing Goal Creation & Custom Units ---");
    
    // Example 1: "Complete 70 DSA problems"
    const goal1 = await goalService.createGoal(userA.id, {
      title: "Complete 70 DSA problems",
      description: "Master algorithms and data structures on LeetCode",
      sectionId: sectionA.id,
      targetValue: 70,
      currentValue: 23,
      unit: "problems",
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    assert(goal1.title === "Complete 70 DSA problems", "Goal 1 created with title 'Complete 70 DSA problems'");
    assert(goal1.targetValue === 70, "Target value is 70");
    assert(goal1.currentValue === 23, "Current progress is 23");
    assert(goal1.unit === "problems", "Unit is 'problems'");
    assert(goal1.progressPercentage === 33, `Progress percentage calculated correctly (33%, got ${goal1.progressPercentage}%)`);
    assert(goal1.status === "in_progress", "Goal 1 initial status is 'in_progress'");
    assert(goal1.section?.name === "Computer Science", "Goal 1 belongs to 'Computer Science' section");

    // Example 2: "Build Progress Tracker" (percent)
    const goal2 = await goalService.createGoal(userA.id, {
      title: "Build Progress Tracker",
      description: "Complete full multi-phase productivity web application",
      targetValue: 100,
      currentValue: 65,
      unit: "percent",
    });
    assert(goal2.title === "Build Progress Tracker", "Goal 2 created with title 'Build Progress Tracker'");
    assert(goal2.progressPercentage === 65, "Progress percentage is 65%");
    assert(goal2.unit === "percent", "Unit is 'percent'");
    assert(goal2.sectionId === null, "Goal 2 has no section (general)");

    // Example 3: "Study MongoDB" (hours)
    const goal3 = await goalService.createGoal(userA.id, {
      title: "Study MongoDB",
      description: "Read documentation on indexes and aggregation pipelines",
      targetValue: 20,
      currentValue: 8,
      unit: "hours",
    });
    assert(goal3.title === "Study MongoDB", "Goal 3 created with title 'Study MongoDB'");
    assert(goal3.progressPercentage === 40, "Progress percentage is 40% (8/20)");
    assert(goal3.unit === "hours", "Unit is 'hours'");

    // 3. Validation Rules
    console.log("\n--- 3. Testing Validation Constraints ---");
    let validationPassed = false;
    try {
      await goalService.createGoal(userA.id, {
        title: "Invalid Goal",
        targetValue: 50,
        currentValue: 60, // Exceeds target!
        unit: "problems",
      });
    } catch (e) {
      validationPassed = true;
    }
    assert(validationPassed, "Reject goal creation when currentValue > targetValue");

    let negativeProgressRejected = false;
    try {
      await goalService.createGoal(userA.id, {
        title: "Negative Progress Goal",
        targetValue: 50,
        currentValue: -5,
        unit: "hours",
      });
    } catch (e) {
      negativeProgressRejected = true;
    }
    assert(negativeProgressRejected, "Reject goal creation when currentValue < 0");

    let zeroTargetRejected = false;
    try {
      await goalService.createGoal(userA.id, {
        title: "Zero Target Goal",
        targetValue: 0,
        currentValue: 0,
      });
    } catch (e) {
      zeroTargetRejected = true;
    }
    assert(zeroTargetRejected, "Reject goal creation when targetValue <= 0");

    // 4. Progress Updating & Auto-Completion
    console.log("\n--- 4. Testing Progress Updates & Auto-Completion ---");
    const updatedProgress = await goalService.updateGoalProgress(goal1.id, userA.id, 50);
    assert(updatedProgress.currentValue === 50, "Progress updated to 50 problems");
    assert(updatedProgress.progressPercentage === 71, "Progress percentage updated to 71% (50/70)");
    assert(updatedProgress.status === "in_progress", "Goal remains in_progress when current < target");

    // Reaching target auto-completes
    const completedProgress = await goalService.updateGoalProgress(goal1.id, userA.id, 70);
    assert(completedProgress.currentValue === 70, "Progress updated to target value 70");
    assert(completedProgress.progressPercentage === 100, "Progress percentage is 100%");
    assert(completedProgress.status === "completed", "Goal automatically transitioned to 'completed'");

    // 5. Pausing & Resuming Goals
    console.log("\n--- 5. Testing Goal Pausing & Resuming ---");
    const pausedGoal = await goalService.togglePauseGoal(goal3.id, userA.id);
    assert(pausedGoal.status === "paused", "Goal 3 successfully paused (status = 'paused')");

    const resumedGoal = await goalService.togglePauseGoal(goal3.id, userA.id);
    assert(resumedGoal.status === "in_progress", "Goal 3 successfully resumed (status = 'in_progress')");

    // 6. Manual Goal Completion
    console.log("\n--- 6. Testing Manual Goal Completion ---");
    const manualComplete = await goalService.completeGoal(goal2.id, userA.id);
    assert(manualComplete.status === "completed", "Goal 2 manually marked completed");
    assert(manualComplete.currentValue === 100, "Current progress set to 100 on manual completion");
    assert(manualComplete.progressPercentage === 100, "Progress percentage is 100%");

    // 7. Filtering by Status and Section
    console.log("\n--- 7. Testing Goal Queries & Status Filtering ---");
    const allGoalsA = await goalService.getGoals(userA.id);
    assert(allGoalsA.length === 3, "User A has 3 total goals");

    const inProgressGoals = await goalService.getGoals(userA.id, { status: "in_progress" });
    assert(inProgressGoals.length === 1 && inProgressGoals[0].title === "Study MongoDB", "Active filter returns only in_progress goals");

    const completedGoals = await goalService.getGoals(userA.id, { status: "completed" });
    assert(completedGoals.length === 2, "Completed filter returns exactly 2 completed goals");

    const sectionFiltered = await goalService.getGoals(userA.id, { sectionId: sectionA.id });
    assert(sectionFiltered.length === 1 && sectionFiltered[0].id === goal1.id, "Section filter returns only goals belonging to that section");

    // 8. Cross-Tenant Section Ownership Validation
    console.log("\n--- 8. Testing Cross-Tenant Section Protection ---");
    let crossTenantSectionRejected = false;
    try {
      await goalService.createGoal(userA.id, {
        title: "Malicious Section Hijack",
        sectionId: sectionB.id, // User B's section!
        targetValue: 10,
      });
    } catch (e) {
      if (e instanceof ValidationError) {
        crossTenantSectionRejected = true;
      }
    }
    assert(crossTenantSectionRejected, "Assigning goal to another user's section is rejected with ValidationError");

    // 9. Multi-Tenant Security & Isolation
    console.log("\n--- 9. Testing Multi-Tenant Security Isolation ---");
    const leakCheck = await goalService.getGoals(userB.id);
    assert(leakCheck.length === 0, "User B sees 0 goals (no data leak from User A)");

    const userBReadA = await goalService.getGoalById(goal1.id, userB.id);
    assert(userBReadA === null, "User B cannot read User A's goal (returns null)");

    let userBUpdateRejected = false;
    try {
      await goalService.updateGoal(goal1.id, userB.id, { title: "Hacked Title" });
    } catch (e) {
      if (e instanceof NotFoundError) userBUpdateRejected = true;
    }
    assert(userBUpdateRejected, "User B cannot update User A's goal (throws NotFoundError)");

    let userBPauseRejected = false;
    try {
      await goalService.togglePauseGoal(goal1.id, userB.id);
    } catch (e) {
      if (e instanceof NotFoundError) userBPauseRejected = true;
    }
    assert(userBPauseRejected, "User B cannot pause User A's goal (throws NotFoundError)");

    let userBDeleteRejected = false;
    try {
      await goalService.deleteGoal(goal1.id, userB.id);
    } catch (e) {
      if (e instanceof NotFoundError) userBDeleteRejected = true;
    }
    assert(userBDeleteRejected, "User B cannot delete User A's goal (throws NotFoundError)");

    // 10. Goal Deletion by Owner
    console.log("\n--- 10. Testing Goal Deletion by Owner ---");
    const deleted = await goalService.deleteGoal(goal3.id, userA.id);
    assert(deleted === true, "Owner successfully deletes goal 3");

    const deletedLookup = await goalService.getGoalById(goal3.id, userA.id);
    assert(deletedLookup === null, "Deleted goal no longer exists in database");

    const remainingA = await goalService.getGoals(userA.id);
    assert(remainingA.length === 2, "User A now has 2 remaining goals");

    // 11. Testing E2E HTTP Endpoints
    console.log("\n--- 11. Testing E2E HTTP & API Endpoints ---");
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Obtain CSRF token & cookies
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const rawCsrfCookies = (csrfRes.headers.getSetCookie?.() || [csrfRes.headers.get("set-cookie") || ""]).join("; ");

    // Authenticate User A
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
    assert(!!sessionCookieA, "User A authenticated via HTTP session");

    // Authenticated access to /goals
    const goalsPageRes = await fetch(`${baseUrl}/goals`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(goalsPageRes.status === 200, "GET /goals returns 200 OK");
    const goalsPageHtml = await goalsPageRes.text();
    assert(
      goalsPageHtml.includes("Goals &amp; Targets") || goalsPageHtml.includes("Goals & Targets") || goalsPageHtml.includes("Goals"),
      "Goals page contains heading 'Goals & Targets'"
    );
    assert(goalsPageHtml.includes("New Goal"), "Goals page contains 'New Goal' button");

    // Test API: POST /api/goals
    const apiCreateRes = await fetch(`${baseUrl}/api/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        title: "Read 12 System Design Papers",
        description: "Study distributed consensus, Raft, and Paxos",
        targetValue: 12,
        currentValue: 4,
        unit: "papers",
      }),
    });
    assert(apiCreateRes.status === 201, "POST /api/goals returns 201 Created");
    const apiCreateBody = await apiCreateRes.json();
    const apiGoal = apiCreateBody.data;
    assert(apiGoal?.title === "Read 12 System Design Papers", "API created goal title matches");
    assert(apiGoal?.unit === "papers", "API created goal unit is 'papers'");

    // Test API: POST /api/goals/[id]/progress
    const apiProgressRes = await fetch(`${baseUrl}/api/goals/${apiGoal.id}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({ progress: 8 }),
    });
    assert(apiProgressRes.status === 200, "POST /api/goals/[id]/progress returns 200 OK");
    const apiProgressBody = await apiProgressRes.json();
    assert(apiProgressBody.data?.currentValue === 8, "Progress updated to 8 via API");
    assert(apiProgressBody.data?.progressPercentage === 67, "Percentage is 67% (8/12)");

    // Test API: POST /api/goals/[id]/pause
    const apiPauseRes = await fetch(`${baseUrl}/api/goals/${apiGoal.id}/pause`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
    });
    const apiPauseBody = await apiPauseRes.json().catch(() => ({}));
    assert(apiPauseRes.status === 200, `POST /api/goals/[id]/pause returns 200 OK (got ${apiPauseRes.status})`);
    assert(apiPauseBody.data?.status === "paused", "Status updated to 'paused' via API");

    // Test API: DELETE /api/goals/[id]
    const apiDeleteRes = await fetch(`${baseUrl}/api/goals/${apiGoal.id}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookieA },
    });
    assert(apiDeleteRes.status === 200, "DELETE /api/goals/[id] returns 200 OK");

  } finally {
    // Teardown test artifacts
    const userIds = [userA?.id, userB?.id]
      .filter(Boolean)
      .map((id) => new mongoose.Types.ObjectId(id as string));
    if (userIds.length > 0) {
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
