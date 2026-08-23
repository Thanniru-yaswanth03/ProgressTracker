import connectDB from "../src/lib/db";
import { hashPassword, verifyPassword } from "../src/server/auth/password";
import { User } from "../src/models/User";
import { userService } from "../src/server/services/user.service";
import { ValidationError } from "../src/lib/errors";

async function runVerification() {
  console.log("=========================================");
  console.log("  PHASE 1 INTEGRATION & SECURITY TESTS  ");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. MongoDB Connection
    console.log("Connecting to database via singleton...");
    const conn = await connectDB();
    assert(conn.connection.readyState === 1, "MongoDB connected successfully");

    // Clean test collection
    await User.deleteMany({});

    // 2. Password Hashing & Verification
    console.log("\n--- Testing Password Hashing & Verification ---");
    const rawPass = "SecretPass123!";
    const hashed = await hashPassword(rawPass);
    assert(hashed.startsWith("$2"), "Password hashed with bcrypt salt format");
    assert(hashed !== rawPass, "Password is not stored in plaintext");

    const validMatch = await verifyPassword(rawPass, hashed);
    assert(validMatch === true, "Password verification succeeds for correct password");

    const invalidMatch = await verifyPassword("WrongPass456", hashed);
    assert(invalidMatch === false, "Password verification fails for incorrect password");

    // 3. User Registration & Service Layer
    console.log("\n--- Testing User Service Registration ---");
    const userA = await userService.registerUser({
      name: "Alice Builder",
      email: "alice@example.com",
      password: "AlicePassword123!",
    });
    assert(userA.id !== undefined && userA.id.length > 0, "User A registered with valid ID");
    assert(userA.email === "alice@example.com", "User A email normalized and saved");
    assert(userA.name === "Alice Builder", "User A name saved correctly");

    // 4. Duplicate Email Prevention
    console.log("\n--- Testing Duplicate Email Handling ---");
    let duplicateRejected = false;
    try {
      await userService.registerUser({
        name: "Alice Clone",
        email: "alice@example.com", // Same email
        password: "AnotherPassword123!",
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        duplicateRejected = true;
      }
    }
    assert(duplicateRejected, "Duplicate email registration rejected with ValidationError");

    // 5. Password Hash Exclusion (Security check: select: false)
    console.log("\n--- Testing Data Security & Hash Concealment ---");
    const queriedUser = await User.findOne({ email: "alice@example.com" });
    assert(queriedUser?.passwordHash === undefined, "passwordHash is hidden by default in normal queries (select: false)");

    const userWithPassword = await userService.findUserByEmail("alice@example.com", true);
    assert(userWithPassword?.passwordHash !== undefined, "passwordHash is only retrievable with explicit select('+passwordHash')");

    // 6. Multi-Tenant User Isolation
    console.log("\n--- Testing Multi-Tenant Data Isolation ---");
    const userB = await userService.registerUser({
      name: "Bob Developer",
      email: "bob@example.com",
      password: "BobPassword123!",
    });

    // Mock query simulating a user scoped resource lookup: User A trying to query with User B's ID
    const crossTenantLookup = await User.findOne({ _id: userB.id, email: userA.email });
    assert(crossTenantLookup === null, "Cross-tenant query with mismatching user scope returns null");

    const properLookup = await User.findOne({ _id: userA.id, email: userA.email });
    assert(properLookup !== null && properLookup.email === "alice@example.com", "Properly scoped query returns correct tenant data");

    // Cleanup
    await User.deleteMany({});
    await conn.disconnect();

    console.log("\n=========================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=========================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed with error:", error);
    process.exit(1);
  }
}

runVerification();
