import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { Section } from "../src/models/Section";
import { Habit } from "../src/models/Habit";
import { HabitLog } from "../src/models/HabitLog";
import { Activity } from "../src/models/Activity";
import { userService } from "../src/server/services/user.service";
import { sectionService } from "../src/server/services/section.service";
import { habitService } from "../src/server/services/habit.service";
import { activityService } from "../src/server/services/activity.service";
import { formatDateKey, shiftDate } from "../src/server/services/streak.service";
import { NotFoundError, ValidationError } from "../src/lib/errors";

async function runHabitsVerification() {
  console.log("=========================================");
  console.log("     HABITS CRUD & SECURITY TESTS        ");
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
    const existingUsers = await User.find({ email: /test_habit_.*@example.com/ });
    const existingIds = existingUsers.map((u) => u._id);
    await Section.deleteMany({ userId: { $in: existingIds } });
    await Habit.deleteMany({ userId: { $in: existingIds } });
    await HabitLog.deleteMany({ userId: { $in: existingIds } });
    await Activity.deleteMany({ userId: { $in: existingIds } });
    await User.deleteMany({ _id: { $in: existingIds } });

    // 1. Setup Test Accounts
    console.log("\n--- 1. Setting Up Test Accounts ---");
    const userA = await userService.registerUser({
      name: "Marcus Aurelius",
      email: "test_habit_marcus@example.com",
      password: "StoicPassword2026!",
    });
    const userB = await userService.registerUser({
      name: "Commodus",
      email: "test_habit_commodus@example.com",
      password: "GladiatorPassword2026!",
    });
    assert(!!userA.id && !!userB.id, "Test Users Marcus (A) and Commodus (B) registered");

    // Create Sections
    const sectionA = await sectionService.createSection(userA.id, {
      name: "Philosophy & Journaling",
      color: "#f59e0b",
    });
    const sectionB = await sectionService.createSection(userB.id, {
      name: "Colosseum Events",
      color: "#ef4444",
    });
    assert(!!sectionA.id && !!sectionB.id, "Sections created for test accounts");

    // 2. Create Daily and Weekly Habits
    console.log("\n--- 2. Testing Habit Creation ---");
    const habitDaily = await habitService.createHabit(userA.id, {
      title: "Morning Journaling & Reflection",
      description: "Write down morning meditations before sunrise",
      sectionId: sectionA.id,
      frequency: "daily",
    });
    assert(!!habitDaily.id, "Daily Habit created with ID", habitDaily.id);
    assert(habitDaily.frequency === "daily", "Frequency is 'daily'");
    assert(habitDaily.streak.currentStreak === 0, "Initial streak is 0");
    assert(habitDaily.streak.isCompletedToday === false, "Initial isCompletedToday is false");
    assert(habitDaily.section?.name === "Philosophy & Journaling", "Section details populated");

    const habitWeekly = await habitService.createHabit(userA.id, {
      title: "Cardio & Physical Conditioning",
      frequency: "weekly",
      targetDays: [1, 3, 5], // Mon, Wed, Fri
    });
    assert(habitWeekly.frequency === "weekly", "Weekly Habit created with targetDays [1,3,5]");

    // 3. Edit Habit
    console.log("\n--- 3. Testing Habit Editing ---");
    const updatedHabit = await habitService.updateHabit(habitDaily.id, userA.id, {
      title: "Morning Meditations & Journaling",
      description: "Reflect on core stoic principles",
    });
    assert(updatedHabit.title === "Morning Meditations & Journaling", "Habit title updated");
    assert(updatedHabit.description === "Reflect on core stoic principles", "Habit description updated");

    // 4. Mark Today's Habit Complete & Verify Streak Engine
    console.log("\n--- 4. Testing Check-in for Today & Dynamic Streak ---");
    const today = formatDateKey(new Date());
    const checkinRes1 = await habitService.toggleHabitLog(habitDaily.id, userA.id, today);
    assert(checkinRes1.completed === true, "Habit check-in for today succeeded");
    assert(checkinRes1.habit.streak.isCompletedToday === true, "isCompletedToday is true");
    assert(checkinRes1.habit.streak.currentStreak === 1, "Current streak calculated to 1");
    assert(checkinRes1.habit.streak.longestStreak === 1, "Longest streak is 1");

    // Verify activity audit log created
    const activities = await activityService.getRecentActivities(userA.id);
    assert(activities.length === 1, "Activity record created on habit completion");
    assert(activities[0].type === "habit_completed", "Activity type is 'habit_completed'");
    assert(activities[0].refId === habitDaily.id, "Activity refId matches completed Habit ID");

    // 5. Backfill Yesterday to test Streak Increment
    console.log("\n--- 5. Testing Streak Increment with Consecutive Check-in ---");
    const yesterday = shiftDate(today, -1);
    const checkinRes2 = await habitService.toggleHabitLog(habitDaily.id, userA.id, yesterday);
    assert(checkinRes2.completed === true, "Habit check-in for yesterday succeeded");
    assert(checkinRes2.habit.streak.currentStreak === 2, "Current streak dynamically increments to 2");
    assert(checkinRes2.habit.streak.longestStreak === 2, "Longest streak dynamically increments to 2");

    // 6. Idempotency & Unique Index Enforcement
    console.log("\n--- 6. Testing Unique Index Constraint on HabitLog ---");
    let duplicateRejected = false;
    try {
      // Direct database insert of identical { habitId, date }
      await HabitLog.create({
        habitId: habitDaily.id,
        userId: userA.id,
        date: today,
        completed: true,
      });
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000) {
        duplicateRejected = true;
      }
    }
    assert(duplicateRejected, "Duplicate HabitLog for same habit and date is rejected by unique index (E11000)");

    // 7. Unchecking Habit & Recalculating Streak
    console.log("\n--- 7. Testing Unchecking Habit & Streak Grace Period ---");
    const uncheckRes = await habitService.toggleHabitLog(habitDaily.id, userA.id, today);
    assert(uncheckRes.completed === false, "Habit unchecked for today");
    assert(uncheckRes.habit.streak.isCompletedToday === false, "isCompletedToday is false");
    assert(uncheckRes.habit.streak.currentStreak === 1, "Current streak is 1 (yesterday active grace period)");

    // 8. Cross-Tenant Section Protection
    console.log("\n--- 8. Testing Cross-Tenant Section Ownership Enforcement ---");
    let crossSectionBlocked = false;
    try {
      await habitService.createHabit(userA.id, {
        title: "Gladiator Training",
        sectionId: sectionB.id, // Belongs to User B!
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        crossSectionBlocked = true;
      }
    }
    assert(crossSectionBlocked, "Assigning habit to another user's section is rejected with ValidationError");

    // 9. Multi-Tenant Habit Security Isolation
    console.log("\n--- 9. Testing Multi-Tenant Habit Security Isolation ---");
    // Commodus (User B) attempts to read Marcus's habit
    const commodusRead = await habitService.getHabitById(habitDaily.id, userB.id);
    assert(commodusRead === null, "User B cannot read User A's habit (returns null)");

    // Commodus attempts to check in Marcus's habit
    let commodusToggleBlocked = false;
    try {
      await habitService.toggleHabitLog(habitDaily.id, userB.id, today);
    } catch (err) {
      if (err instanceof NotFoundError) {
        commodusToggleBlocked = true;
      }
    }
    assert(commodusToggleBlocked, "User B cannot toggle User A's habit (throws NotFoundError)");

    // Commodus attempts to update Marcus's habit
    let commodusUpdateBlocked = false;
    try {
      await habitService.updateHabit(habitDaily.id, userB.id, { title: "Corrupted by Commodus" });
    } catch (err) {
      if (err instanceof NotFoundError) {
        commodusUpdateBlocked = true;
      }
    }
    assert(commodusUpdateBlocked, "User B cannot update User A's habit (throws NotFoundError)");

    // Commodus attempts to delete Marcus's habit
    let commodusDeleteBlocked = false;
    try {
      await habitService.deleteHabit(habitDaily.id, userB.id);
    } catch (err) {
      if (err instanceof NotFoundError) {
        commodusDeleteBlocked = true;
      }
    }
    assert(commodusDeleteBlocked, "User B cannot delete User A's habit (throws NotFoundError)");

    // 10. Archive & Delete by Owner
    console.log("\n--- 10. Testing Archive & Deletion by Owner ---");
    const archivedHabit = await habitService.archiveHabit(habitDaily.id, userA.id, true);
    assert(archivedHabit.archived === true, "Habit archived successfully");

    const deleteResult = await habitService.deleteHabit(habitDaily.id, userA.id);
    assert(deleteResult === true, "Habit deleted by owner returns true");

    const deletedHabit = await habitService.getHabitById(habitDaily.id, userA.id);
    assert(deletedHabit === null, "Deleted habit no longer exists");

    const remainingLogs = await HabitLog.find({ habitId: habitDaily.id });
    assert(remainingLogs.length === 0, "All associated habit logs purged upon deletion");

    // Cleanup
    await Section.deleteMany({ userId: { $in: [userA.id, userB.id] } });
    await Habit.deleteMany({ userId: { $in: [userA.id, userB.id] } });
    await HabitLog.deleteMany({ userId: { $in: [userA.id, userB.id] } });
    await Activity.deleteMany({ userId: { $in: [userA.id, userB.id] } });
    await User.deleteMany({ _id: { $in: [userA.id, userB.id] } });
    await conn.disconnect();

    console.log("\n=========================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=========================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Habits verification failed with error:", error);
    process.exit(1);
  }
}

runHabitsVerification();
