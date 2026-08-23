import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { Section } from "../src/models/Section";
import { Activity } from "../src/models/Activity";
import { userService } from "../src/server/services/user.service";
import { sectionService } from "../src/server/services/section.service";

async function testActivitiesHttpFlow() {
  console.log("=================================================");
  console.log("  ACTIVITIES & TIMELINE E2E HTTP & API TEST     ");
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
    const emailA = `barry_${Date.now()}@example.com`;
    const emailB = `eobard_${Date.now()}@example.com`;
    const pass = "SpeedForcePassword2026!";

    const userA = await userService.registerUser({ name: "Barry Allen", email: emailA, password: pass });
    const userB = await userService.registerUser({ name: "Eobard Thawne", email: emailB, password: pass });

    const sectionA = await sectionService.createSection(userA.id, {
      name: "STAR Labs Research",
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

    // 3. Unauthenticated access to /activities and /api/activities
    console.log("\n--- 2. Testing Unauthenticated Route Protection ---");
    const unauthPageRes = await fetch(`${baseUrl}/activities`, { redirect: "manual" });
    assert(
      unauthPageRes.status === 307 || unauthPageRes.status === 308 || unauthPageRes.status === 302,
      "/activities redirects unauthenticated request"
    );
    assert(
      (unauthPageRes.headers.get("location") || "").includes("/login"),
      "/activities redirects to /login"
    );

    const unauthApiRes = await fetch(`${baseUrl}/api/activities`);
    assert(unauthApiRes.status === 401, "GET /api/activities returns 401 Unauthorized for guests");

    // 4. Authenticated access to /activities and /dashboard
    console.log("\n--- 3. Testing Authenticated Page Rendering ---");
    const authPageRes = await fetch(`${baseUrl}/activities`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(authPageRes.status === 200, "GET /activities returns 200 OK for User A");
    const pageHtml = await authPageRes.text();
    assert(pageHtml.includes("Activity Timeline"), "/activities contains page title 'Activity Timeline'");
    assert(pageHtml.includes("Log Activity"), "/activities contains 'Log Activity' button");

    const authDashRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(authDashRes.status === 200, "GET /dashboard returns 200 OK");
    const dashHtml = await authDashRes.text();
    assert(
      dashHtml.includes("Recent Activity Feed") || dashHtml.includes("Recent Activity Timeline"),
      "Dashboard contains Recent Activity feed"
    );
    assert(
      dashHtml.includes("Focus Logged") || dashHtml.includes("Done Accomplishments"),
      "Dashboard displays focus/activity metrics"
    );

    // 5. Create Activity via POST /api/activities
    console.log("\n--- 4. Testing Activity Recording via API ---");
    const createRes = await fetch(`${baseUrl}/api/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        title: "Tachyon Particle Calibration",
        description: "Successfully stabilized the particle accelerator velocity harness",
        sectionId: sectionA.id,
        duration: 75,
        tags: ["physics", "speedforce", "lab"],
        occurredAt: new Date().toISOString(),
      }),
    });
    assert(createRes.status === 201, "POST /api/activities returns 201 Created");
    const createBody = await createRes.json();
    const createdAct = createBody.data;
    assert(createdAct?.title === "Tachyon Particle Calibration", "Created activity title matches");
    assert(createdAct?.duration === 75, "Created activity duration is 75 mins");
    assert(createdAct?.tags.includes("speedforce"), "Tags include 'speedforce'");
    const activityId = createdAct.id;

    // 6. Verify Dashboard timeline updates
    console.log("\n--- 5. Testing Dashboard Timeline Persistence ---");
    const updatedDashRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { Cookie: sessionCookieA },
    });
    const updatedDashHtml = await updatedDashRes.text();
    assert(
      updatedDashHtml.includes("Tachyon Particle Calibration"),
      "Dashboard Activity Timeline renders recorded activity"
    );

    // 7. Update Activity via PATCH /api/activities/[id]
    console.log("\n--- 6. Testing Activity Updating via API ---");
    const patchRes = await fetch(`${baseUrl}/api/activities/${activityId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        title: "Tachyon Particle & Speed Harness Calibration",
        duration: 90,
      }),
    });
    assert(patchRes.status === 200, "PATCH /api/activities/[id] returns 200 OK");
    const patchBody = await patchRes.json();
    assert(
      patchBody.data?.title === "Tachyon Particle & Speed Harness Calibration",
      "Activity title updated"
    );
    assert(patchBody.data?.duration === 90, "Activity duration updated to 90 mins");

    // 8. Multi-Tenant API Protection
    console.log("\n--- 7. Testing Multi-Tenant API Protection ---");
    const userBGet = await fetch(`${baseUrl}/api/activities/${activityId}`, {
      headers: { Cookie: sessionCookieB },
    });
    assert(userBGet.status === 404, "User B GET on User A's activity returns 404 Not Found");

    const userBPatch = await fetch(`${baseUrl}/api/activities/${activityId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieB,
      },
      body: JSON.stringify({ title: "Hacked by Reverse Flash" }),
    });
    assert(userBPatch.status === 404, "User B PATCH on User A's activity returns 404 Not Found");

    const userBDelete = await fetch(`${baseUrl}/api/activities/${activityId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookieB },
    });
    assert(userBDelete.status === 404, "User B DELETE on User A's activity returns 404 Not Found");

    // 9. Delete Activity as Owner
    console.log("\n--- 8. Testing Activity Deletion by Owner ---");
    const ownerDelete = await fetch(`${baseUrl}/api/activities/${activityId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookieA },
    });
    assert(ownerDelete.status === 200, "Owner DELETE /api/activities/[id] returns 200 OK");

    const afterDeleteGet = await fetch(`${baseUrl}/api/activities/${activityId}`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(afterDeleteGet.status === 404, "Subsequent GET /api/activities/[id] returns 404 Not Found");

    // Cleanup
    await User.deleteMany({ email: { $in: [emailA, emailB] } });
    await Section.deleteMany({});
    await Activity.deleteMany({});
    await conn.disconnect();

    console.log("\n=================================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("HTTP activity test execution error:", error);
    process.exit(1);
  }
}

testActivitiesHttpFlow();
