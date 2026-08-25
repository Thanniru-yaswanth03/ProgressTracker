import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { Task } from "../src/models/Task";
import { Habit } from "../src/models/Habit";
import { HabitLog } from "../src/models/HabitLog";
import { Goal } from "../src/models/Goal";
import { Section } from "../src/models/Section";
import { Activity } from "../src/models/Activity";
import { userService } from "../src/server/services/user.service";
import { taskService } from "../src/server/services/task.service";
import { habitService } from "../src/server/services/habit.service";
import { goalService } from "../src/server/services/goal.service";
import { sectionService } from "../src/server/services/section.service";
import { aiService } from "../src/server/services/ai.service";
import { shiftDate, formatDateKey } from "../src/server/services/streak.service";
import mongoose from "mongoose";

async function runAIAssistantTests() {
  console.log("=================================================");
  console.log("  AI PROGRESS ASSISTANT E2E VERIFICATION SUITE   ");
  console.log("=================================================\n");

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

  const todayStr = formatDateKey(new Date());

  try {
    // 1. Database Connection
    console.log("Connecting to database...");
    const conn = await connectDB();
    assert(conn.connection.readyState === 1, "MongoDB connected successfully");

    // Clean test accounts
    await User.deleteMany({ email: { $in: ["ai_alice@test.com", "ai_bob@test.com", "ai_charlie@test.com"] } });

    // 2. Multi-Tenant User Creation
    console.log("\n--- Setting up Multi-Tenant Test Users ---");
    const alice = await userService.registerUser({
      name: "Alice Developer",
      email: "ai_alice@test.com",
      password: "AlicePassword123!",
    });

    const bob = await userService.registerUser({
      name: "Bob Designer",
      email: "ai_bob@test.com",
      password: "BobPassword123!",
    });

    const charlie = await userService.registerUser({
      name: "Charlie Newbie",
      email: "ai_charlie@test.com",
      password: "CharliePassword123!",
    });

    assert(Boolean(alice.id && bob.id && charlie.id), "Registered test users Alice, Bob, and Charlie");

    // 3. Populate Alice's Data (Overdue task, urgent task, habit streak, goal)
    console.log("\n--- Populating Alice's Domain Data ---");
    const aliceSection = await sectionService.createSection(alice.id, {
      name: "Computer Science",
      color: "#6366f1",
    });

    // Overdue task (due 3 days ago)
    const overdueTask = await taskService.createTask(alice.id, {
      title: "Binary Trees & BST Implementation",
      description: "Implement AVL and Red-Black tree rebalancing",
      priority: "urgent",
      sectionId: aliceSection.id,
      dueDate: shiftDate(todayStr, -3),
    });

    // Task due today
    const dueTodayTask = await taskService.createTask(alice.id, {
      title: "Graph Algorithms (Dijkstra)",
      description: "Solve 2 shortest path problems",
      priority: "high",
      sectionId: aliceSection.id,
      dueDate: todayStr,
    });

    // Quick task
    const quickTask = await taskService.createTask(alice.id, {
      title: "Fix Typo in README",
      description: "Quick 5-minute documentation fix",
      priority: "low",
      sectionId: aliceSection.id,
    });

    // Alice Habit with 4-day streak
    const aliceHabit = await habitService.createHabit(alice.id, {
      title: "LeetCode Daily Problem",
      frequency: "daily",
      sectionId: aliceSection.id,
    });

    // Log past 4 days for streak
    for (let i = 1; i <= 4; i++) {
      await habitService.toggleHabitLog(aliceHabit.id, alice.id, shiftDate(todayStr, -i));
    }

    // Alice Goal
    const aliceGoal = await goalService.createGoal(alice.id, {
      title: "Master DSA for Interviews",
      description: "Complete 100 algorithm problems",
      targetValue: 100,
      currentValue: 45,
      unit: "problems",
      sectionId: aliceSection.id,
      targetDate: shiftDate(todayStr, 30),
    });

    assert(Boolean(overdueTask && dueTodayTask && quickTask && aliceHabit && aliceGoal), "Alice data generated");

    // 4. Populate Bob's Distinct Data
    console.log("\n--- Populating Bob's Domain Data ---");
    const bobSection = await sectionService.createSection(bob.id, {
      name: "Design System",
      color: "#ec4899",
    });

    const bobTask = await taskService.createTask(bob.id, {
      title: "Figma UI Kit Redesign",
      priority: "medium",
      sectionId: bobSection.id,
      dueDate: shiftDate(todayStr, 5),
    });

    assert(Boolean(bobTask), "Bob data generated");

    // 5. Test Multi-Tenant Context Isolation
    console.log("\n--- Testing Multi-Tenant Context Isolation ---");
    const aliceContext = await aiService.buildUserProgressContext(alice.id);
    const bobContext = await aiService.buildUserProgressContext(bob.id);

    assert(
      aliceContext.tasks.overdue.some((t) => t.title.includes("Binary Trees")),
      "Alice context includes Alice's overdue task"
    );
    assert(
      !aliceContext.tasks.upcoming.some((t) => t.title.includes("Figma UI Kit")),
      "Alice context does NOT contain Bob's task (Multi-tenant security isolation verified)"
    );
    assert(
      bobContext.tasks.upcoming.some((t) => t.title.includes("Figma UI Kit")),
      "Bob context includes Bob's task"
    );
    assert(
      !bobContext.tasks.overdue.some((t) => t.title.includes("Binary Trees")),
      "Bob context does NOT contain Alice's task"
    );

    // 6. Test Context Calculations
    console.log("\n--- Testing Objective Fact Calculations ---");
    assert(aliceContext.tasks.overdue.length === 1, "Alice has exactly 1 overdue task calculated");
    assert(aliceContext.tasks.overdue[0].daysOverdue === 3, "Overdue days accurately calculated as 3 days");
    assert(aliceContext.tasks.dueToday.length === 1, "Alice has exactly 1 task due today");
    assert(aliceContext.habits[0].currentStreak === 4, "Alice habit streak accurately recognized as 4 days");
    assert(aliceContext.goals[0].progressPercentage === 45, "Alice goal progress percentage computed as 45%");

    // 7. Test Empty Data User (Charlie)
    console.log("\n--- Testing Empty User Context (Charlie) ---");
    const charlieContext = await aiService.buildUserProgressContext(charlie.id);
    assert(charlieContext.userSummary.totalPendingTasks === 0, "Charlie has 0 pending tasks");
    assert(charlieContext.userSummary.totalActiveHabits === 0, "Charlie has 0 habits");
    assert(charlieContext.userSummary.totalGoals === 0, "Charlie has 0 goals");

    const charlieInsights = await aiService.getQuickInsights(charlie.id);
    assert(typeof charlieInsights.greeting === "string", "Charlie quick insights generated valid greeting");
    assert(charlieInsights.highlights.length > 0, "Charlie quick insights has friendly fallback highlight");

    // 8. Test Structured AI Response Parser
    console.log("\n--- Testing Structured AI Response Parser & Normalizer ---");
    const sampleRawJson = JSON.stringify({
      answer: "You should focus on Binary Trees first as it is overdue.",
      summary: "Prioritize overdue DSA work.",
      priorities: [
        {
          taskId: overdueTask.id,
          taskTitle: "Binary Trees & BST Implementation",
          priority: "critical",
          reason: "Overdue by 3 days and urgent.",
          estimatedMinutes: 45,
        },
      ],
      insights: ["Your DSA goal is 45% complete."],
      warnings: ["1 overdue task detected."],
      suggestedActions: ["Complete binary tree deletion method."],
    });

    const parsedClean = aiService.parseStructuredAIResponse(sampleRawJson);
    assert(parsedClean.priorities.length === 1, "Parser successfully parsed priorities array");
    assert(parsedClean.priorities[0].priority === "critical", "Parser normalized critical priority");
    assert(parsedClean.insights[0].includes("45%"), "Parser preserved insights");

    // Test markdown wrapped json
    const wrappedJson = "```json\n" + sampleRawJson + "\n```";
    const parsedWrapped = aiService.parseStructuredAIResponse(wrappedJson);
    assert(parsedWrapped.priorities.length === 1, "Parser handled markdown codeblock stripping");

    // Test raw text fallback
    const rawPlainText = "Here is some plain advice without JSON.";
    const parsedFallback = aiService.parseStructuredAIResponse(rawPlainText);
    assert(parsedFallback.answer === rawPlainText, "Parser gracefully handled plain text fallback");

    // 9. Live OpenRouter API Call Test
    console.log("\n--- Testing Live OpenRouter Integration ---");
    const userPrompt = "What should I work on today? I have about 45 minutes.";
    console.log(`Sending prompt to OpenRouter: "${userPrompt}"...`);

    const aiResult = await aiService.chatWithAssistant(alice.id, [
      { role: "user", content: userPrompt },
    ]);

    assert(Boolean(aiResult && aiResult.answer), "OpenRouter returned a valid response");
    assert(typeof aiResult.summary === "string" && aiResult.summary.length > 0, "Response contains summary");
    assert(Array.isArray(aiResult.priorities), "Response contains structured priorities array");

    console.log("\n--- AI Assistant Response Sample ---");
    console.log("Summary:", aiResult.summary);
    console.log("Priorities:", JSON.stringify(aiResult.priorities, null, 2));
    console.log("Insights:", aiResult.insights);
    console.log("Warnings:", aiResult.warnings);

    // Verify grounding: response mentions Alice's actual tasks
    const fullText = (aiResult.answer + " " + JSON.stringify(aiResult.priorities)).toLowerCase();
    const groundedInAliceData =
      fullText.includes("binary") ||
      fullText.includes("tree") ||
      fullText.includes("graph") ||
      fullText.includes("leetcode") ||
      fullText.includes("dsa");

    assert(groundedInAliceData, "AI response is grounded in Alice's actual tasks/goals and not generic advice");

    // 10. Clean up Test Data
    console.log("\n--- Cleaning up Test Data ---");
    await Task.deleteMany({ userId: { $in: [alice.id, bob.id, charlie.id] } });
    await Habit.deleteMany({ userId: { $in: [alice.id, bob.id, charlie.id] } });
    await HabitLog.deleteMany({ userId: { $in: [alice.id, bob.id, charlie.id] } });
    await Goal.deleteMany({ userId: { $in: [alice.id, bob.id, charlie.id] } });
    await Section.deleteMany({ userId: { $in: [alice.id, bob.id, charlie.id] } });
    await Activity.deleteMany({ userId: { $in: [alice.id, bob.id, charlie.id] } });
    await User.deleteMany({ _id: { $in: [alice.id, bob.id, charlie.id] } });

    await conn.disconnect();

    console.log("\n=================================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

runAIAssistantTests();
