import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { Section } from "../src/models/Section";
import { Habit } from "../src/models/Habit";
import { HabitLog } from "../src/models/HabitLog";
import { Activity } from "../src/models/Activity";
import { userService } from "../src/server/services/user.service";
import { sectionService } from "../src/server/services/section.service";
import { formatDateKey, shiftDate } from "../src/server/services/streak.service";

async function testHabitsHttpFlow() {
  console.log("=================================================");
  console.log("    PHASE 4 HABITS E2E HTTP & API TEST SUITE     ");
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

    // 1. Setup Test Accounts
    console.log("--- 1. Setting Up Test Accounts ---");
    const emailA = `seneca_${Date.now()}@example.com`;
    const emailB = `nero_${Date.now()}@example.com`;
    const pass = "StoicLetters2026!";

    const userA = await userService.registerUser({ name: "Lucius Seneca", email: emailA, password: pass });
    const userB = await userService.registerUser({ name: "Emperor Nero", email: emailB, password: pass });

    const sectionA = await sectionService.createSection(userA.id, {
      name: "Stoic Ethics",
      color: "#f59e0b",
    });

    // 2. Authenticate User A
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const rawCsrfCookies = csrfRes.headers.get("set-cookie") || "";

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

    // Authenticate User B
    const loginResB = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: rawCsrfCookies,
      },
      body: new URLSearchParams({
        email: emailB,
        password: pass,
        csrfToken: csrfData.csrfToken,
        json: "true",
      }),
      redirect: "manual",
    });
    const sessionCookieB = (loginResB.headers.getSetCookie?.() || [loginResB.headers.get("set-cookie") || ""]).join("; ");
    assert(!!sessionCookieB, "User B authenticated with session cookie");

    // 3. Unauthenticated access to /habits and /api/habits
    console.log("\n--- 2. Testing Unauthenticated Route Protection ---");
    const unauthPageRes = await fetch(`${baseUrl}/habits`, { redirect: "manual" });
    assert(
      unauthPageRes.status === 307 || unauthPageRes.status === 308 || unauthPageRes.status === 302,
      "/habits redirects unauthenticated request"
    );
    assert(
      (unauthPageRes.headers.get("location") || "").includes("/login"),
      "/habits redirects to /login"
    );

    const unauthApiRes = await fetch(`${baseUrl}/api/habits`);
    assert(unauthApiRes.status === 401, "GET /api/habits returns 401 Unauthorized for guests");

    // 4. Authenticated access to /habits page
    console.log("\n--- 3. Testing Authenticated /habits Page Render ---");
    const authPageRes = await fetch(`${baseUrl}/habits`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(authPageRes.status === 200, "GET /habits returns 200 OK for User A");
    const pageHtml = await authPageRes.text();
    assert(pageHtml.includes("Habit Streaks"), "/habits contains page title 'Habit Streaks'");
    assert(pageHtml.includes("New Habit"), "/habits contains 'New Habit' button");

    // 5. Create Habit via POST /api/habits
    console.log("\n--- 4. Testing Habit Creation via API ---");
    const createRes = await fetch(`${baseUrl}/api/habits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        title: "Daily Moral Epistles Writing",
        description: "Write philosophical guidance to Lucilius",
        sectionId: sectionA.id,
        frequency: "daily",
      }),
    });
    assert(createRes.status === 201, "POST /api/habits returns 201 Created");
    const createBody = await createRes.json();
    const createdHabit = createBody.data;
    assert(createdHabit?.title === "Daily Moral Epistles Writing", "Created habit title matches");
    assert(createdHabit?.frequency === "daily", "Created habit frequency is 'daily'");
    assert(createdHabit?.streak?.currentStreak === 0, "Initial streak is 0");
    const habitId = createdHabit.id;

    // 6. Check In for Today via POST /api/habits/[id]/log
    console.log("\n--- 5. Testing Habit Check-In Toggle via API ---");
    const today = formatDateKey(new Date());
    const logRes1 = await fetch(`${baseUrl}/api/habits/${habitId}/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({ date: today }),
    });
    assert(logRes1.status === 200, "POST /api/habits/[id]/log returns 200 OK");
    const logBody1 = await logRes1.json();
    assert(logBody1.data?.completed === true, "Habit marked completed");
    assert(logBody1.data?.habit?.streak?.isCompletedToday === true, "isCompletedToday is true");
    assert(logBody1.data?.habit?.streak?.currentStreak === 1, "Current streak calculated to 1");

    // 7. Check In for Yesterday to test streak progression
    console.log("\n--- 6. Testing Consecutive Streak Progression ---");
    const yesterday = shiftDate(today, -1);
    const logRes2 = await fetch(`${baseUrl}/api/habits/${habitId}/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({ date: yesterday }),
    });
    assert(logRes2.status === 200, "POST /api/habits/[id]/log for yesterday returns 200 OK");
    const logBody2 = await logRes2.json();
    assert(logBody2.data?.habit?.streak?.currentStreak === 2, "Current streak progresses to 2");
    assert(logBody2.data?.habit?.streak?.longestStreak === 2, "Longest streak is 2");

    // 8. Update Habit via PATCH /api/habits/[id]
    console.log("\n--- 7. Testing Habit Updating via API ---");
    const patchRes = await fetch(`${baseUrl}/api/habits/${habitId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        title: "Daily Letters to Lucilius",
      }),
    });
    assert(patchRes.status === 200, "PATCH /api/habits/[id] returns 200 OK");
    const patchBody = await patchRes.json();
    assert(patchBody.data?.title === "Daily Letters to Lucilius", "Habit title updated");

    // 9. Archive Habit via POST /api/habits/[id]/archive
    console.log("\n--- 8. Testing Habit Archiving via API ---");
    const archiveRes = await fetch(`${baseUrl}/api/habits/${habitId}/archive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({ archived: true }),
    });
    assert(archiveRes.status === 200, "POST /api/habits/[id]/archive returns 200 OK");
    const archiveBody = await archiveRes.json();
    assert(archiveBody.data?.archived === true, "Habit archived status is true");

    // 10. Multi-Tenant Cross-User API Protection
    console.log("\n--- 9. Testing Multi-Tenant API Protection ---");
    const userBGet = await fetch(`${baseUrl}/api/habits/${habitId}`, {
      headers: { Cookie: sessionCookieB },
    });
    assert(userBGet.status === 404, "User B GET on User A's habit returns 404 Not Found");

    const userBLog = await fetch(`${baseUrl}/api/habits/${habitId}/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieB,
      },
    });
    assert(userBLog.status === 404, "User B POST log on User A's habit returns 404 Not Found");

    const userBDelete = await fetch(`${baseUrl}/api/habits/${habitId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookieB },
    });
    assert(userBDelete.status === 404, "User B DELETE on User A's habit returns 404 Not Found");

    // 11. Delete Habit as Owner
    console.log("\n--- 10. Testing Habit Deletion by Owner ---");
    const ownerDelete = await fetch(`${baseUrl}/api/habits/${habitId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookieA },
    });
    assert(ownerDelete.status === 200, "Owner DELETE /api/habits/[id] returns 200 OK");

    const afterDeleteGet = await fetch(`${baseUrl}/api/habits/${habitId}`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(afterDeleteGet.status === 404, "Subsequent GET /api/habits/[id] returns 404 Not Found");

    // Cleanup
    await User.deleteMany({ email: { $in: [emailA, emailB] } });
    await Section.deleteMany({});
    await Habit.deleteMany({});
    await HabitLog.deleteMany({});
    await Activity.deleteMany({});
    await conn.disconnect();

    console.log("\n=================================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("HTTP habits test execution error:", error);
    process.exit(1);
  }
}

testHabitsHttpFlow();
