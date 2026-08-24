import { escapeRegex, isValidDateString, dateStringSchema } from "../src/lib/utils";
import { CreateActivitySchema, UpdateActivitySchema } from "../src/server/services/activity.service";
import { CreateTaskSchema, UpdateTaskSchema } from "../src/server/services/task.service";
import { CreateGoalSchema, UpdateGoalSchema } from "../src/server/services/goal.service";
import { CreateSectionSchema, UpdateSectionSchema } from "../src/server/services/section.service";
import { RegisterSchema } from "../src/server/services/user.service";

function runHardeningVerification() {
  console.log("==================================================");
  console.log("    PRODUCTION HARDENING UNIT VERIFICATION SUITE  ");
  console.log("==================================================\n");

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

  // ----------------------------------------------------
  // 1. Regex Search Security
  // ----------------------------------------------------
  console.log("--- 1. Regex Injection & Special Character Escaping ---");
  const specialChars = ".*+?^${}()|[]\\";
  const escaped = escapeRegex(specialChars);
  assert(
    escaped === "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\",
    "escapeRegex escapes all special regex characters correctly"
  );

  const testString = "Project (v2) [Core] + Bug? $100 & 100% {done}";
  const testPattern = new RegExp(escapeRegex("Project (v2) [Core] + Bug? $100 & 100% {done}"));
  assert(testPattern.test(testString), "Escaped string compiles into a safe literal RegExp match");

  const evilReDoS = "((a+)+)+$";
  const escapedEvil = new RegExp(escapeRegex(evilReDoS));
  assert(escapedEvil.test("((a+)+)+$"), "ReDoS payload is treated strictly as literal string");

  // ----------------------------------------------------
  // 2. Strict Date Validation
  // ----------------------------------------------------
  console.log("\n--- 2. Strict Date Validation ---");
  assert(isValidDateString("2026-08-24T12:00:00.000Z"), "Valid ISO timestamp is valid");
  assert(isValidDateString("2026-08-24"), "Valid YYYY-MM-DD date is valid");
  assert(!isValidDateString("2026-02-30"), "Invalid leap/month calendar date (Feb 30) is rejected");
  assert(!isValidDateString("not-a-date"), "Arbitrary non-date string is rejected");
  assert(!isValidDateString("99999999-99-99"), "Out of bounds date string is rejected");

  const dateSchemaTestPass = dateStringSchema.safeParse("2026-12-31T23:59:59.000Z");
  assert(dateSchemaTestPass.success, "dateStringSchema parses valid ISO date");

  const dateSchemaTestFail = dateStringSchema.safeParse("invalid-date-xyz");
  assert(!dateSchemaTestFail.success, "dateStringSchema rejects invalid date string");

  // ----------------------------------------------------
  // 3. Activity Type Data Integrity (No spoofing system activities)
  // ----------------------------------------------------
  console.log("\n--- 3. Activity Type Integrity ---");
  const clientManualActivity = CreateActivitySchema.safeParse({
    title: "Manual Coding Session",
    duration: 60,
    occurredAt: "2026-08-24T15:00:00.000Z",
  });
  assert(clientManualActivity.success, "Client can create manual_entry activity without specifying type");
  if (clientManualActivity.success) {
    assert(
      clientManualActivity.data.type === "manual_entry",
      "Activity type defaults to manual_entry"
    );
  }

  const clientSpoofedTaskCompleted = CreateActivitySchema.safeParse({
    title: "Fake Task Completed",
    type: "task_completed",
    refId: "507f1f77bcf86cd799439011",
  });
  assert(
    !clientSpoofedTaskCompleted.success,
    "Client cannot spoof type: 'task_completed' via CreateActivitySchema"
  );

  const clientSpoofedHabitCompleted = CreateActivitySchema.safeParse({
    title: "Fake Habit Completed",
    type: "habit_completed",
    refId: "507f1f77bcf86cd799439011",
  });
  assert(
    !clientSpoofedHabitCompleted.success,
    "Client cannot spoof type: 'habit_completed' via CreateActivitySchema"
  );

  // ----------------------------------------------------
  // 4. Task Validation Hardening
  // ----------------------------------------------------
  console.log("\n--- 4. Task Validation Hardening ---");
  const validTask = CreateTaskSchema.safeParse({
    title: "Complete audit review",
    priority: "high",
    dueDate: "2026-08-30T18:00:00.000Z",
  });
  assert(validTask.success, "Valid task with ISO dueDate passes");

  const invalidTaskDueDate = CreateTaskSchema.safeParse({
    title: "Task with bad date",
    dueDate: "malformed-date",
  });
  assert(!invalidTaskDueDate.success, "Task with malformed dueDate is rejected");

  const emptyTitleTask = CreateTaskSchema.safeParse({
    title: "   ",
  });
  assert(!emptyTitleTask.success, "Task with empty/whitespace title is rejected");

  // ----------------------------------------------------
  // 5. Goal Validation Hardening
  // ----------------------------------------------------
  console.log("\n--- 5. Goal Validation Hardening ---");
  const validGoal = CreateGoalSchema.safeParse({
    title: "Ship v1.0",
    currentValue: 50,
    targetValue: 100,
    targetDate: "2026-09-01",
  });
  assert(validGoal.success, "Valid goal with valid targetDate passes");

  const goalExceedingTarget = CreateGoalSchema.safeParse({
    title: "Exceeding progress",
    currentValue: 150,
    targetValue: 100,
  });
  assert(!goalExceedingTarget.success, "Goal with currentValue > targetValue is rejected");

  const goalInvalidDate = CreateGoalSchema.safeParse({
    title: "Goal bad date",
    targetDate: "bad-date-format",
  });
  assert(!goalInvalidDate.success, "Goal with invalid targetDate is rejected");

  // ----------------------------------------------------
  // 6. Section Validation Hardening
  // ----------------------------------------------------
  console.log("\n--- 6. Section Validation Hardening ---");
  const validSection = CreateSectionSchema.safeParse({
    name: "Engineering",
    color: "#6366f1",
  });
  assert(validSection.success, "Valid section with hex color passes");

  const invalidSectionColor = CreateSectionSchema.safeParse({
    name: "Engineering",
    color: "not-a-color",
  });
  assert(!invalidSectionColor.success, "Section with invalid hex color is rejected");

  // ----------------------------------------------------
  // 7. User Registration Validation
  // ----------------------------------------------------
  console.log("\n--- 7. User Registration Validation ---");
  const validUser = RegisterSchema.safeParse({
    name: "Alice Developer",
    email: "Alice@Example.Com",
    password: "secure_password_123",
  });
  assert(validUser.success, "Valid user registration passes and email is normalized");
  if (validUser.success) {
    assert(validUser.data.email === "alice@example.com", "Email is lowercased and trimmed");
  }

  const invalidEmailUser = RegisterSchema.safeParse({
    name: "Bob",
    email: "not-an-email",
    password: "password123",
  });
  assert(!invalidEmailUser.success, "User registration with invalid email is rejected");

  const shortPassUser = RegisterSchema.safeParse({
    name: "Bob",
    email: "bob@example.com",
    password: "123",
  });
  assert(!shortPassUser.success, "User registration with short password (<6 chars) is rejected");

  console.log("\n==================================================");
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runHardeningVerification();
