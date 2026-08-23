import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { Section } from "../src/models/Section";
import { Task } from "../src/models/Task";
import { Activity } from "../src/models/Activity";
import { userService } from "../src/server/services/user.service";
import { sectionService } from "../src/server/services/section.service";

async function testTasksHttpFlow() {
  console.log("=================================================");
  console.log("    PHASE 3 TASKS E2E HTTP & API TEST SUITE     ");
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

    // 1. Setup Test Users
    console.log("--- 1. Setting Up Test Accounts ---");
    const emailA = `steve_${Date.now()}@example.com`;
    const emailB = `tony_${Date.now()}@example.com`;
    const pass = "AvengerPassword2026!";

    const userA = await userService.registerUser({ name: "Steve Rogers", email: emailA, password: pass });
    const userB = await userService.registerUser({ name: "Tony Stark", email: emailB, password: pass });

    const sectionA = await sectionService.createSection(userA.id, {
      name: "Shield Tactics",
      color: "#0ea5e9",
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

    // 3. Unauthenticated access to /tasks and /api/tasks
    console.log("\n--- 2. Testing Unauthenticated Route Protection ---");
    const unauthPageRes = await fetch(`${baseUrl}/tasks`, { redirect: "manual" });
    assert(
      unauthPageRes.status === 307 || unauthPageRes.status === 308 || unauthPageRes.status === 302,
      "/tasks redirects unauthenticated request"
    );
    assert(
      (unauthPageRes.headers.get("location") || "").includes("/login"),
      "/tasks redirects to /login"
    );

    const unauthApiRes = await fetch(`${baseUrl}/api/tasks`);
    assert(unauthApiRes.status === 401, "GET /api/tasks returns 401 Unauthorized for guests");

    // 4. Authenticated access to /tasks page
    console.log("\n--- 3. Testing Authenticated /tasks Page Render ---");
    const authPageRes = await fetch(`${baseUrl}/tasks`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(authPageRes.status === 200, "GET /tasks returns 200 OK for User A");
    const pageHtml = await authPageRes.text();
    assert(pageHtml.includes("Action Tasks"), "/tasks contains page title 'Action Tasks'");
    assert(pageHtml.includes("New Task"), "/tasks contains 'New Task' button");

    // 5. Create Task via POST /api/tasks
    console.log("\n--- 4. Testing Task Creation via API ---");
    const createRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        title: "Assemble Avengers briefing",
        description: "Plan quarterly defense strategies",
        sectionId: sectionA.id,
        priority: "high",
        dueDate: "2026-09-15",
      }),
    });
    assert(createRes.status === 201, "POST /api/tasks returns 201 Created");
    const createBody = await createRes.json();
    const createdTask = createBody.data;
    assert(createdTask?.title === "Assemble Avengers briefing", "Created task title matches");
    assert(createdTask?.priority === "high", "Created task priority is 'high'");
    assert(createdTask?.status === "pending", "Created task status is 'pending'");
    const taskId = createdTask.id;

    // 6. Toggle Task to Completed via POST /api/tasks/[id]/toggle
    console.log("\n--- 5. Testing Task Completion Toggle via API ---");
    const completeRes = await fetch(`${baseUrl}/api/tasks/${taskId}/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({ status: "completed" }),
    });
    assert(completeRes.status === 200, "POST /api/tasks/[id]/toggle returns 200 OK on complete");
    const completeBody = await completeRes.json();
    assert(completeBody.data?.status === "completed", "Task status is 'completed'");
    assert(completeBody.data?.completedAt !== null, "Task completedAt is populated");

    // 7. Toggle Task back to Reopened (Pending)
    console.log("\n--- 6. Testing Task Reopen Toggle via API ---");
    const reopenRes = await fetch(`${baseUrl}/api/tasks/${taskId}/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({ status: "pending" }),
    });
    assert(reopenRes.status === 200, "POST /api/tasks/[id]/toggle returns 200 OK on reopen");
    const reopenBody = await reopenRes.json();
    assert(reopenBody.data?.status === "pending", "Task status reverted to 'pending'");
    assert(reopenBody.data?.completedAt === null, "Task completedAt is null");

    // 8. Update Task via PATCH /api/tasks/[id]
    console.log("\n--- 7. Testing Task Updating via API ---");
    const patchRes = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        title: "Assemble Global Defense Protocol",
        priority: "urgent",
      }),
    });
    assert(patchRes.status === 200, "PATCH /api/tasks/[id] returns 200 OK");
    const patchBody = await patchRes.json();
    assert(patchBody.data?.title === "Assemble Global Defense Protocol", "Task title updated");
    assert(patchBody.data?.priority === "urgent", "Task priority updated to 'urgent'");

    // 9. Multi-Tenant Cross-User API Protection
    console.log("\n--- 8. Testing Multi-Tenant API Protection ---");
    // User B attempts to GET User A's task
    const userBGet = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
      headers: { Cookie: sessionCookieB },
    });
    assert(userBGet.status === 404, "User B GET on User A's task returns 404 Not Found");

    // User B attempts to PATCH User A's task
    const userBPatch = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieB,
      },
      body: JSON.stringify({ title: "Hacked by Stark" }),
    });
    assert(userBPatch.status === 404, "User B PATCH on User A's task returns 404 Not Found");

    // User B attempts to toggle User A's task
    const userBToggle = await fetch(`${baseUrl}/api/tasks/${taskId}/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieB,
      },
    });
    assert(userBToggle.status === 404, "User B POST toggle on User A's task returns 404 Not Found");

    // User B attempts to DELETE User A's task
    const userBDelete = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookieB },
    });
    assert(userBDelete.status === 404, "User B DELETE on User A's task returns 404 Not Found");

    // 10. Delete Task as Owner
    console.log("\n--- 9. Testing Task Deletion by Owner ---");
    const ownerDelete = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookieA },
    });
    assert(ownerDelete.status === 200, "Owner DELETE /api/tasks/[id] returns 200 OK");

    const afterDeleteGet = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(afterDeleteGet.status === 404, "Subsequent GET /api/tasks/[id] returns 404 Not Found");

    // Cleanup
    await User.deleteMany({ email: { $in: [emailA, emailB] } });
    await Section.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    await conn.disconnect();

    console.log("\n=================================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("HTTP task test execution error:", error);
    process.exit(1);
  }
}

testTasksHttpFlow();
