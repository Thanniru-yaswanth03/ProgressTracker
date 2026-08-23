import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { Section } from "../src/models/Section";
import { userService } from "../src/server/services/user.service";

async function testSectionsHttpFlow() {
  console.log("=================================================");
  console.log("  PHASE 2 SECTIONS E2E HTTP & API TEST SUITE    ");
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

    // 1. Setup User A (Barry Allen) and User B (Eobard Thawne)
    console.log("--- 1. Setting Up Test Accounts ---");
    const emailA = `barry_${Date.now()}@example.com`;
    const emailB = `eobard_${Date.now()}@example.com`;
    const pass = "SpeedForce2026!";

    await userService.registerUser({ name: "Barry Allen", email: emailA, password: pass });
    await userService.registerUser({ name: "Eobard Thawne", email: emailB, password: pass });

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

    const cookieHeadersA = loginResA.headers.getSetCookie?.() || [loginResA.headers.get("set-cookie") || ""];
    const sessionCookieA = cookieHeadersA.join("; ");
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
    const cookieHeadersB = loginResB.headers.getSetCookie?.() || [loginResB.headers.get("set-cookie") || ""];
    const sessionCookieB = cookieHeadersB.join("; ");
    assert(!!sessionCookieB, "User B authenticated with session cookie");

    // 3. Unauthenticated access to /sections and /api/sections
    console.log("\n--- 2. Testing Unauthenticated Route Protection ---");
    const unauthPageRes = await fetch(`${baseUrl}/sections`, { redirect: "manual" });
    assert(
      unauthPageRes.status === 307 || unauthPageRes.status === 308 || unauthPageRes.status === 302,
      "/sections redirects unauthenticated request"
    );
    assert(
      (unauthPageRes.headers.get("location") || "").includes("/login"),
      "/sections redirects to /login"
    );

    const unauthApiRes = await fetch(`${baseUrl}/api/sections`);
    assert(unauthApiRes.status === 401, "GET /api/sections returns 401 Unauthorized for guests");

    // 4. Authenticated access to /sections page
    console.log("\n--- 3. Testing Authenticated /sections Page Render ---");
    const authPageRes = await fetch(`${baseUrl}/sections`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(authPageRes.status === 200, "GET /sections returns 200 OK for User A");
    const pageHtml = await authPageRes.text();
    assert(
      pageHtml.includes("Life &amp; Focus Sections") || pageHtml.includes("Life & Focus Sections") || pageHtml.includes("Focus Sections"),
      "/sections contains page title"
    );
    assert(pageHtml.includes("New Section"), "/sections contains 'New Section' button");

    // 5. Create Section via POST /api/sections
    console.log("\n--- 4. Testing Section Creation via API ---");
    const createRes = await fetch(`${baseUrl}/api/sections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        name: "CSI Lab Investigation",
        description: "Forensic science and research",
        color: "#0ea5e9",
      }),
    });
    assert(createRes.status === 201, "POST /api/sections returns 201 Created");
    const createBody = await createRes.json();
    const createdSection = createBody.data;
    assert(createdSection?.name === "CSI Lab Investigation", "Created section name matches");
    assert(createdSection?.color === "#0ea5e9", "Created section color matches");
    const sectionId = createdSection.id;

    // 6. Read Section via GET /api/sections/[id]
    console.log("\n--- 5. Testing Section Detail Lookup ---");
    const detailRes = await fetch(`${baseUrl}/api/sections/${sectionId}`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(detailRes.status === 200, "GET /api/sections/[id] returns 200 OK for owner");
    const detailBody = await detailRes.json();
    assert(detailBody.data?.name === "CSI Lab Investigation", "Detail lookup returns correct section");

    // Check HTML page /sections/[id]
    const sectionHtmlRes = await fetch(`${baseUrl}/sections/${sectionId}`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(sectionHtmlRes.status === 200, "GET /sections/[id] HTML page returns 200 OK");
    const sectionHtml = await sectionHtmlRes.text();
    assert(sectionHtml.includes("CSI Lab Investigation"), "Section detail HTML contains section title");

    // 7. Update Section via PATCH /api/sections/[id]
    console.log("\n--- 6. Testing Section Renaming & Updating ---");
    const patchRes = await fetch(`${baseUrl}/api/sections/${sectionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieA,
      },
      body: JSON.stringify({
        name: "Central City Forensic Lab",
        color: "#10b981",
      }),
    });
    assert(patchRes.status === 200, "PATCH /api/sections/[id] returns 200 OK");
    const patchBody = await patchRes.json();
    assert(patchBody.data?.name === "Central City Forensic Lab", "Section name updated to Central City Forensic Lab");
    assert(patchBody.data?.color === "#10b981", "Section color updated to Emerald");

    // 8. Multi-Tenant Cross-User Isolation via API
    console.log("\n--- 7. Testing Multi-Tenant API Protection ---");
    // User B attempts to GET User A's section
    const userBGet = await fetch(`${baseUrl}/api/sections/${sectionId}`, {
      headers: { Cookie: sessionCookieB },
    });
    assert(userBGet.status === 404, "User B GET on User A's section returns 404 Not Found");

    // User B attempts to PATCH User A's section
    const userBPatch = await fetch(`${baseUrl}/api/sections/${sectionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookieB,
      },
      body: JSON.stringify({ name: "Hacked by Eobard" }),
    });
    assert(userBPatch.status === 404, "User B PATCH on User A's section returns 404 Not Found");

    // User B attempts to DELETE User A's section
    const userBDelete = await fetch(`${baseUrl}/api/sections/${sectionId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookieB },
    });
    assert(userBDelete.status === 404, "User B DELETE on User A's section returns 404 Not Found");

    // 9. Delete Section as Owner
    console.log("\n--- 8. Testing Section Deletion by Owner ---");
    const ownerDelete = await fetch(`${baseUrl}/api/sections/${sectionId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookieA },
    });
    assert(ownerDelete.status === 200, "Owner DELETE /api/sections/[id] returns 200 OK");

    const afterDeleteGet = await fetch(`${baseUrl}/api/sections/${sectionId}`, {
      headers: { Cookie: sessionCookieA },
    });
    assert(afterDeleteGet.status === 404, "Subsequent GET /api/sections/[id] returns 404 Not Found");

    // Cleanup
    await User.deleteMany({ email: { $in: [emailA, emailB] } });
    await Section.deleteMany({});
    await conn.disconnect();

    console.log("\n=================================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("HTTP test execution error:", error);
    process.exit(1);
  }
}

testSectionsHttpFlow();
