import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { Section } from "../src/models/Section";
import { Goal } from "../src/models/Goal";
import { userService } from "../src/server/services/user.service";
import { sectionService } from "../src/server/services/section.service";
import { goalService } from "../src/server/services/goal.service";
import { NotFoundError, ValidationError } from "../src/lib/errors";

async function runGoalsVerification() {
  console.log("=========================================");
  console.log("      GOALS CRUD & SECURITY TESTS        ");
  console.log("=========================================\n");

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
    assert(conn.connection.readyState === 1, "MongoDB connected successfully");

    // Clean test data
    const existingUsers = await User.find({ email: /test_goal_.*@example.com/ });
    const existingIds = existingUsers.map((u) => u._id);
    await Section.deleteMany({ userId: { $in: existingIds } });
    await Goal.deleteMany({ userId: { $in: existingIds } });
    await User.deleteMany({ _id: { $in: existingIds } });

    // 1. Setup Test Accounts
    console.log("\n--- 1. Setting Up Test Accounts ---");
    const userA = await userService.registerUser({
      name: "Marie Curie",
      email: "test_goal_marie@example.com",
      password: "NobelPrize2026!",
    });
    const userB = await userService.registerUser({
      name: "Rutherford",
      email: "test_goal_rutherford@example.com",
      password: "AtomicPassword2026!",
    });
    assert(!!userA.id && !!userB.id, "Test Users Marie (A) and Rutherford (B) registered");

    const sectionA = await sectionService.createSection(userA.id, {
      name: "Radioactivity Research",
      color: "#10b981",
    });
    const sectionB = await sectionService.createSection(userB.id, {
      name: "Nuclear Physics",
      color: "#6366f1",
    });

    // 2. Create Goal
    console.log("\n--- 2. Testing Goal Creation ---");
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30); // 30 days from now

    const goal = await goalService.createGoal(userA.id, {
      title: "Isolate Radium Samples",
      description: "Purify 100 grams of pitchblende ore",
      sectionId: sectionA.id,
      currentValue: 25,
      targetValue: 100,
      unit: "grams",
      targetDate: targetDate.toISOString(),
    });
    assert(!!goal.id, "Goal created with ID", goal.id);
    assert(goal.progressPercentage === 25, "Initial progress percentage is 25%");
    assert(goal.daysRemaining !== null && goal.daysRemaining !== undefined && goal.daysRemaining >= 29, "Days remaining calculated");
    assert(goal.status === "in_progress", "Status is 'in_progress'");
    assert(goal.section?.name === "Radioactivity Research", "Section details populated");

    // 3. Update Goal Progress
    console.log("\n--- 3. Testing Goal Progress Update ---");
    const updatedGoal = await goalService.updateGoal(goal.id, userA.id, {
      currentValue: 100,
    });
    assert(updatedGoal.currentValue === 100, "Current value updated to 100");
    assert(updatedGoal.progressPercentage === 100, "Progress percentage is 100%");
    assert(updatedGoal.status === "completed", "Status automatically marked as completed");

    // 4. Cross-Tenant Section Ownership Enforcement
    console.log("\n--- 4. Testing Cross-Tenant Section Protection ---");
    let crossSectionBlocked = false;
    try {
      await goalService.createGoal(userA.id, {
        title: "Unauthorized Section Goal",
        sectionId: sectionB.id, // Belongs to User B!
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        crossSectionBlocked = true;
      }
    }
    assert(crossSectionBlocked, "Assigning goal to another user's section is rejected with ValidationError");

    // 5. Multi-Tenant Goal Security Isolation
    console.log("\n--- 5. Testing Multi-Tenant Goal Security Isolation ---");
    const rutherfordRead = await goalService.getGoalById(goal.id, userB.id);
    assert(rutherfordRead === null, "User B cannot read User A's goal (returns null)");

    let rutherfordUpdateBlocked = false;
    try {
      await goalService.updateGoal(goal.id, userB.id, { title: "Hacked by Rutherford" });
    } catch (err) {
      if (err instanceof NotFoundError) {
        rutherfordUpdateBlocked = true;
      }
    }
    assert(rutherfordUpdateBlocked, "User B cannot update User A's goal (throws NotFoundError)");

    let rutherfordDeleteBlocked = false;
    try {
      await goalService.deleteGoal(goal.id, userB.id);
    } catch (err) {
      if (err instanceof NotFoundError) {
        rutherfordDeleteBlocked = true;
      }
    }
    assert(rutherfordDeleteBlocked, "User B cannot delete User A's goal (throws NotFoundError)");

    // 6. Delete Goal as Owner
    console.log("\n--- 6. Testing Goal Deletion by Owner ---");
    const deleteResult = await goalService.deleteGoal(goal.id, userA.id);
    assert(deleteResult === true, "Goal deleted by owner returns true");

    const deletedGoal = await goalService.getGoalById(goal.id, userA.id);
    assert(deletedGoal === null, "Deleted goal no longer exists");

    // Cleanup
    await User.deleteMany({ email: /test_goal_.*@example.com/ });
    await Section.deleteMany({});
    await Goal.deleteMany({});
    await conn.disconnect();

    console.log("\n=========================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=========================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Goals verification failed with error:", error);
    process.exit(1);
  }
}

runGoalsVerification();
