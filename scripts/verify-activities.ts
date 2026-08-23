import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { Section } from "../src/models/Section";
import { Activity } from "../src/models/Activity";
import { userService } from "../src/server/services/user.service";
import { sectionService } from "../src/server/services/section.service";
import { activityService } from "../src/server/services/activity.service";
import { NotFoundError, ValidationError } from "../src/lib/errors";

async function runActivitiesVerification() {
  console.log("=========================================");
  console.log("    ACTIVITIES CRUD & SECURITY TESTS     ");
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
    const existingUsers = await User.find({ email: /test_act_.*@example.com/ });
    const existingIds = existingUsers.map((u) => u._id);
    await Section.deleteMany({ userId: { $in: existingIds } });
    await Activity.deleteMany({ userId: { $in: existingIds } });
    await User.deleteMany({ _id: { $in: existingIds } });

    // 1. Setup Test Accounts
    console.log("\n--- 1. Setting Up Test Accounts ---");
    const userA = await userService.registerUser({
      name: "Bruce Wayne",
      email: "test_act_bruce@example.com",
      password: "BatPassword2026!",
    });
    const userB = await userService.registerUser({
      name: "Arthur Fleck",
      email: "test_act_arthur@example.com",
      password: "JokerPassword2026!",
    });
    assert(!!userA.id && !!userB.id, "Test Users Bruce (A) and Arthur (B) registered");

    // Create Sections
    const sectionA = await sectionService.createSection(userA.id, {
      name: "Wayne Enterprises R&D",
      color: "#6366f1",
    });
    const sectionB = await sectionService.createSection(userB.id, {
      name: "Comedy Club",
      color: "#ec4899",
    });
    assert(!!sectionA.id && !!sectionB.id, "Sections created for test accounts");

    // 2. Create Activity
    console.log("\n--- 2. Testing Activity Logging ---");
    const act1 = await activityService.createActivity(userA.id, {
      title: "60-min Cryptography Audit",
      description: "Reviewed Batcomputer intrusion detection protocols",
      sectionId: sectionA.id,
      duration: 60,
      tags: ["security", "deep-work", "batcomputer"],
      occurredAt: new Date("2026-08-23T14:30:00Z").toISOString(),
    });
    assert(!!act1.id, "Activity 1 recorded with ID", act1.id);
    assert(act1.title === "60-min Cryptography Audit", "Activity title persisted accurately");
    assert(act1.duration === 60, "Activity duration is 60 minutes");
    assert(act1.tags.includes("security") && act1.tags.includes("deep-work"), "Tags saved and normalized");
    assert(act1.section?.name === "Wayne Enterprises R&D", "Activity populated with section details");
    assert(act1.type === "manual_entry", "Default type is 'manual_entry'");

    // 3. Edit Activity
    console.log("\n--- 3. Testing Activity Editing ---");
    const updatedAct = await activityService.updateActivity(act1.id, userA.id, {
      title: "90-min Full Security Audit",
      duration: 90,
      tags: ["security", "deep-work", "batcomputer", "firewall"],
    });
    assert(updatedAct.title === "90-min Full Security Audit", "Activity title updated");
    assert(updatedAct.duration === 90, "Activity duration updated to 90 mins");
    assert(updatedAct.tags.includes("firewall"), "New tag added successfully");

    // 4. Querying & Filtering Activities
    console.log("\n--- 4. Testing Activity Querying & Filtering ---");
    // Create second activity
    await activityService.createActivity(userA.id, {
      title: "Gym Workout & Martial Arts",
      duration: 45,
      tags: ["fitness", "combat"],
    });

    const allActs = await activityService.getActivities(userA.id);
    assert(allActs.length === 2, "User A retrieves exactly 2 activities");

    const sectionFiltered = await activityService.getActivities(userA.id, {
      sectionId: sectionA.id,
    });
    assert(sectionFiltered.length === 1, "Section filter returns exactly 1 activity in Wayne Enterprises");

    const tagFiltered = await activityService.getActivities(userA.id, {
      tag: "fitness",
    });
    assert(tagFiltered.length === 1, "Tag filter #fitness returns 1 gym activity");

    const searchFiltered = await activityService.getActivities(userA.id, {
      search: "Martial",
    });
    assert(searchFiltered.length === 1, "Search for 'Martial' returns 1 matching activity");

    // 5. Cross-Tenant Section Protection
    console.log("\n--- 5. Testing Cross-Tenant Section Ownership Enforcement ---");
    let crossSectionBlocked = false;
    try {
      await activityService.createActivity(userA.id, {
        title: "Unauthorized Section Assignment",
        sectionId: sectionB.id, // Belongs to User B!
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        crossSectionBlocked = true;
      }
    }
    assert(crossSectionBlocked, "Assigning activity to another user's section is rejected with ValidationError");

    // 6. Multi-Tenant Activity Security Isolation
    console.log("\n--- 6. Testing Multi-Tenant Activity Security Isolation ---");
    // Arthur (User B) attempts to read Bruce's activity
    const arthurRead = await activityService.getActivityById(act1.id, userB.id);
    assert(arthurRead === null, "User B cannot read User A's activity (returns null)");

    // Arthur attempts to update Bruce's activity
    let arthurUpdateBlocked = false;
    try {
      await activityService.updateActivity(act1.id, userB.id, { title: "Hacked by Joker" });
    } catch (err) {
      if (err instanceof NotFoundError) {
        arthurUpdateBlocked = true;
      }
    }
    assert(arthurUpdateBlocked, "User B cannot update User A's activity (throws NotFoundError)");

    // Arthur attempts to delete Bruce's activity
    let arthurDeleteBlocked = false;
    try {
      await activityService.deleteActivity(act1.id, userB.id);
    } catch (err) {
      if (err instanceof NotFoundError) {
        arthurDeleteBlocked = true;
      }
    }
    assert(arthurDeleteBlocked, "User B cannot delete User A's activity (throws NotFoundError)");

    // 7. Activity Deletion by Owner
    console.log("\n--- 7. Testing Activity Deletion by Owner ---");
    const deleteResult = await activityService.deleteActivity(act1.id, userA.id);
    assert(deleteResult === true, "Activity deleted by owner returns true");

    const deletedAct = await activityService.getActivityById(act1.id, userA.id);
    assert(deletedAct === null, "Deleted activity no longer exists");

    // Cleanup
    await Section.deleteMany({ userId: { $in: [userA.id, userB.id] } });
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
    console.error("Activity verification failed with error:", error);
    process.exit(1);
  }
}

runActivitiesVerification();
