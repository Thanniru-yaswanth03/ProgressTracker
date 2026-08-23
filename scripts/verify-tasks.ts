import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { Section } from "../src/models/Section";
import { Task } from "../src/models/Task";
import { Activity } from "../src/models/Activity";
import { userService } from "../src/server/services/user.service";
import { sectionService } from "../src/server/services/section.service";
import { taskService } from "../src/server/services/task.service";
import { activityService } from "../src/server/services/activity.service";
import { NotFoundError, ValidationError } from "../src/lib/errors";

async function runTaskVerification() {
  console.log("=========================================");
  console.log("    PHASE 3 TASKS CRUD & AUDIT TESTS     ");
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
    const existingUsers = await User.find({ email: /test_task_.*@example.com/ });
    const existingIds = existingUsers.map((u) => u._id);
    await Section.deleteMany({ userId: { $in: existingIds } });
    await Task.deleteMany({ userId: { $in: existingIds } });
    await Activity.deleteMany({ userId: { $in: existingIds } });
    await User.deleteMany({ _id: { $in: existingIds } });

    // 1. Setup User A (Peter Parker) and User B (Norman Osborn)
    console.log("\n--- 1. Setting Up Test Accounts ---");
    const userA = await userService.registerUser({
      name: "Peter Parker",
      email: "test_task_peter@example.com",
      password: "WebSlinger2026!",
    });
    const userB = await userService.registerUser({
      name: "Norman Osborn",
      email: "test_task_norman@example.com",
      password: "GoblinPassword2026!",
    });
    assert(!!userA.id && !!userB.id, "Test Users Peter (A) and Norman (B) registered");

    // Create a Section for Peter and one for Norman
    const peterSection = await sectionService.createSection(userA.id, {
      name: "Photography",
      color: "#0ea5e9",
    });
    const normanSection = await sectionService.createSection(userB.id, {
      name: "Oscorp Projects",
      color: "#10b981",
    });
    assert(!!peterSection.id && !!normanSection.id, "Sections created for test accounts");

    // 2. Create Task
    console.log("\n--- 2. Testing Task Creation ---");
    const task1 = await taskService.createTask(userA.id, {
      title: "Photograph Spider-Man for Bugle",
      description: "Deliver high quality front page photos to J. Jonah Jameson",
      sectionId: peterSection.id,
      priority: "urgent",
      dueDate: "2026-09-01",
    });
    assert(!!task1.id, "Task 1 created with ID", task1.id);
    assert(task1.title === "Photograph Spider-Man for Bugle", "Task title persisted");
    assert(task1.status === "pending", "Task status is 'pending' by default");
    assert(task1.priority === "urgent", "Task priority is 'urgent'");
    assert(task1.section?.name === "Photography", "Task populated with section details");
    assert(task1.completedAt === null, "completedAt is null for pending task");

    // 3. Edit Task
    console.log("\n--- 3. Testing Task Editing ---");
    const updatedTask = await taskService.updateTask(task1.id, userA.id, {
      title: "Deliver Front Page Photos",
      priority: "high",
    });
    assert(updatedTask.title === "Deliver Front Page Photos", "Task title updated");
    assert(updatedTask.priority === "high", "Task priority updated to 'high'");

    // 4. Complete Task & Activity Log Verification
    console.log("\n--- 4. Testing Task Completion & Activity Logging ---");
    const completedTask = await taskService.toggleTaskStatus(task1.id, userA.id, "completed");
    assert(completedTask.status === "completed", "Task status switched to 'completed'");
    assert(completedTask.completedAt !== null, "Task completedAt timestamp is set");

    // Check activity audit trail
    const activities = await activityService.getRecentActivities(userA.id);
    assert(activities.length === 1, "Activity record created on task completion");
    assert(activities[0].type === "task_completed", "Activity type is 'task_completed'");
    assert(activities[0].refId === task1.id, "Activity refId matches completed Task ID");
    assert(activities[0].title === "Deliver Front Page Photos", "Activity title snapshot recorded accurately");

    // 5. Reopen Task & Activity Cleanup
    console.log("\n--- 5. Testing Task Reopening ---");
    const reopenedTask = await taskService.toggleTaskStatus(task1.id, userA.id, "pending");
    assert(reopenedTask.status === "pending", "Task status reverted to 'pending'");
    assert(reopenedTask.completedAt === null, "completedAt reset to null upon reopening");

    const activitiesAfterReopen = await activityService.getRecentActivities(userA.id);
    assert(activitiesAfterReopen.length === 0, "Activity log cleaned up when task is reopened");

    // 6. Cross-Tenant Section Protection
    console.log("\n--- 6. Testing Cross-Tenant Section Ownership Enforcement ---");
    let crossSectionBlocked = false;
    try {
      // Peter attempts to create a task assigned to Norman's section
      await taskService.createTask(userA.id, {
        title: "Infiltrate Oscorp",
        sectionId: normanSection.id, // Belongs to User B!
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        crossSectionBlocked = true;
      }
    }
    assert(crossSectionBlocked, "Assigning task to another user's section is rejected with ValidationError");

    // 7. Multi-Tenant Task Data Isolation
    console.log("\n--- 7. Testing Multi-Tenant Task Security Isolation ---");
    // Norman (User B) attempts to read Peter's task
    const normanRead = await taskService.getTaskById(task1.id, userB.id);
    assert(normanRead === null, "User B cannot read User A's task (returns null)");

    // Norman attempts to update Peter's task
    let normanUpdateBlocked = false;
    try {
      await taskService.updateTask(task1.id, userB.id, { title: "Hacked by Goblin" });
    } catch (err) {
      if (err instanceof NotFoundError) {
        normanUpdateBlocked = true;
      }
    }
    assert(normanUpdateBlocked, "User B cannot update User A's task (throws NotFoundError)");

    // Norman attempts to toggle Peter's task
    let normanToggleBlocked = false;
    try {
      await taskService.toggleTaskStatus(task1.id, userB.id, "completed");
    } catch (err) {
      if (err instanceof NotFoundError) {
        normanToggleBlocked = true;
      }
    }
    assert(normanToggleBlocked, "User B cannot toggle User A's task (throws NotFoundError)");

    // Norman attempts to delete Peter's task
    let normanDeleteBlocked = false;
    try {
      await taskService.deleteTask(task1.id, userB.id);
    } catch (err) {
      if (err instanceof NotFoundError) {
        normanDeleteBlocked = true;
      }
    }
    assert(normanDeleteBlocked, "User B cannot delete User A's task (throws NotFoundError)");

    // 8. Delete Task by Owner
    console.log("\n--- 8. Testing Task Deletion by Owner ---");
    const deleteResult = await taskService.deleteTask(task1.id, userA.id);
    assert(deleteResult === true, "Task deleted by owner returns true");

    const deletedTask = await taskService.getTaskById(task1.id, userA.id);
    assert(deletedTask === null, "Deleted task no longer exists");

    // Cleanup
    await User.deleteMany({ email: /test_task_.*@example.com/ });
    await Section.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    await conn.disconnect();

    console.log("\n=========================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=========================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Task verification failed with error:", error);
    process.exit(1);
  }
}

runTaskVerification();
