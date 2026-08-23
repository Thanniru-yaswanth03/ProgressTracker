import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { userService } from "../src/server/services/user.service";

async function testFullE2EFlow() {
  console.log("=================================================");
  console.log("  PHASE 1 COMPLETE E2E HTTP & AUTH LIFECYCLE   ");
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
    // 1. Unauthenticated Route Guards
    console.log("--- 1. Testing Unauthenticated Route Guards ---");
    const rootRes = await fetch(`${baseUrl}/`, { redirect: "manual" });
    assert(
      rootRes.status === 307 || rootRes.status === 308 || rootRes.status === 302,
      "Root (/) redirects unauthenticated user"
    );
    assert(
      (rootRes.headers.get("location") || "").includes("/login"),
      "Root (/) redirects to /login"
    );

    const dashRes = await fetch(`${baseUrl}/dashboard`, { redirect: "manual" });
    assert(
      dashRes.status === 307 || dashRes.status === 308 || dashRes.status === 302,
      "Dashboard (/dashboard) redirects unauthenticated user"
    );
    assert(
      (dashRes.headers.get("location") || "").includes("/login"),
      "Dashboard redirects to /login"
    );

    // 2. UI Pages Rendering
    console.log("\n--- 2. Testing Auth UI Rendering ---");
    const loginRes = await fetch(`${baseUrl}/login`);
    const loginHtml = await loginRes.text();
    assert(loginRes.status === 200, "Login page renders successfully (200 OK)");
    assert(loginHtml.includes("Welcome Back"), "Login page contains 'Welcome Back'");
    assert(loginHtml.includes("name=\"email\""), "Login page contains email input");
    assert(loginHtml.includes("name=\"password\""), "Login page contains password input");

    const regRes = await fetch(`${baseUrl}/register`);
    const regHtml = await regRes.text();
    assert(regRes.status === 200, "Register page renders successfully (200 OK)");
    assert(regHtml.includes("Create Your Account"), "Register page contains 'Create Your Account'");

    // 3. User Registration via Service
    console.log("\n--- 3. Testing Registration & DB Persistence ---");
    const conn = await connectDB();
    const testEmail = `e2e_user_${Date.now()}@example.com`;
    const testPassword = "E2EPassword2026!";
    const testName = "Diana Prince";

    const registeredUser = await userService.registerUser({
      name: testName,
      email: testEmail,
      password: testPassword,
    });
    assert(!!registeredUser.id, "User registered in MongoDB with ID", registeredUser.id);
    assert(registeredUser.email === testEmail, "User email persisted accurately");

    // Verify persistence in MongoDB directly
    const persisted = await User.findOne({ email: testEmail });
    assert(persisted !== null, "User record found in MongoDB database");
    assert(persisted?.name === testName, "User name matches persisted record");

    // 4. Authentication via NextAuth Callback Endpoint
    console.log("\n--- 4. Testing Credentials Authentication API ---");
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const rawCsrfCookies = csrfRes.headers.get("set-cookie") || "";
    const csrfToken = csrfData.csrfToken;

    // Post to callback credentials endpoint
    const loginApiRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: rawCsrfCookies,
      },
      body: new URLSearchParams({
        email: testEmail,
        password: testPassword,
        csrfToken: csrfToken,
        json: "true",
      }),
      redirect: "manual",
    });

    const setCookieHeaders = loginApiRes.headers.getSetCookie?.() || [loginApiRes.headers.get("set-cookie") || ""];
    const allCookies = setCookieHeaders.join("; ");
    const hasSessionCookie = allCookies.includes("authjs.session-token") || allCookies.includes("next-auth.session-token");
    assert(hasSessionCookie, "Auth.js / NextAuth session cookie issued upon login");

    // 5. Accessing Protected Dashboard with Session Cookie
    console.log("\n--- 5. Testing Authenticated Access to Protected Routes ---");
    const authDashRes = await fetch(`${baseUrl}/dashboard`, {
      headers: {
        Cookie: allCookies,
      },
    });
    assert(authDashRes.status === 200, "Dashboard returns 200 OK for authenticated user");
    const authDashHtml = await authDashRes.text();
    assert(authDashHtml.includes(testName), "Dashboard includes personalized greeting for Diana Prince");
    assert(authDashHtml.includes(testEmail), "Dashboard includes user email in session profile");
    assert(authDashHtml.includes("Authenticated Session Active"), "Dashboard displays active session status");
    assert(authDashHtml.includes("Multi-tenant session isolation enabled"), "Dashboard displays active security status");

    // 6. Accessing Login while Authenticated (should redirect to /dashboard)
    console.log("\n--- 6. Testing Auth Route Protection (Logged-in User Redirect) ---");
    const loggedInLoginRes = await fetch(`${baseUrl}/login`, {
      headers: {
        Cookie: allCookies,
      },
      redirect: "manual",
    });
    assert(
      loggedInLoginRes.status === 307 || loggedInLoginRes.status === 308 || loggedInLoginRes.status === 302,
      "Logged-in user accessing /login is redirected"
    );
    assert(
      (loggedInLoginRes.headers.get("location") || "").includes("/dashboard"),
      "Redirect target for logged-in user is /dashboard"
    );

    // 7. Cleanup
    await User.deleteMany({ email: testEmail });
    await conn.disconnect();

    console.log("\n=================================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("E2E Test execution failed with error:", error);
    process.exit(1);
  }
}

testFullE2EFlow();
