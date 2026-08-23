import {
  calculateHabitStreak,
  formatDateKey,
  shiftDate,
  buildWeekHistory,
} from "../src/server/services/streak.service";

function runStreakEngineTests() {
  console.log("=========================================");
  console.log("   PURE STREAK ENGINE UNIT TEST SUITE    ");
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

  const today = "2026-08-23";
  const yesterday = "2026-08-22";
  const twoDaysAgo = "2026-08-21";
  const threeDaysAgo = "2026-08-20";
  const fourDaysAgo = "2026-08-19";
  const tomorrow = "2026-08-24";

  // 1. Zero completions
  console.log("--- 1. Empty Logs ---");
  const s0 = calculateHabitStreak([], { today });
  assert(s0.currentStreak === 0, "Empty logs have 0 current streak");
  assert(s0.longestStreak === 0, "Empty logs have 0 longest streak");
  assert(s0.isCompletedToday === false, "Empty logs isCompletedToday is false");

  // 2. Completed today only
  console.log("\n--- 2. Today Only ---");
  const s1 = calculateHabitStreak([today], { today });
  assert(s1.currentStreak === 1, "Completed today gives current streak of 1");
  assert(s1.longestStreak === 1, "Completed today gives longest streak of 1");
  assert(s1.isCompletedToday === true, "isCompletedToday is true");

  // 3. Completed today and yesterday
  console.log("\n--- 3. Today & Yesterday (2 consecutive days) ---");
  const s2 = calculateHabitStreak([today, yesterday], { today });
  assert(s2.currentStreak === 2, "Completed today + yesterday gives streak of 2");
  assert(s2.longestStreak === 2, "Longest streak is 2");

  // 4. Completed yesterday only (Grace Period for Today)
  console.log("\n--- 4. Active Grace Period (Yesterday done, Today pending) ---");
  const s3 = calculateHabitStreak([yesterday], { today });
  assert(s3.currentStreak === 1, "Done yesterday (not yet today) preserves active streak of 1");
  assert(s3.isCompletedToday === false, "isCompletedToday is false");

  const s4 = calculateHabitStreak([yesterday, twoDaysAgo, threeDaysAgo], { today });
  assert(s4.currentStreak === 3, "Done past 3 days (not yet today) preserves active streak of 3");

  // 5. Missed Yesterday and Today (Streak Broken)
  console.log("\n--- 5. Broken Streak (Missed yesterday and today) ---");
  const s5 = calculateHabitStreak([twoDaysAgo, threeDaysAgo], { today });
  assert(s5.currentStreak === 0, "Missed yesterday and today resets current streak to 0");
  assert(s5.longestStreak === 2, "Longest streak preserves the historical 2-day run");

  // 6. Longer historical run vs shorter current run
  console.log("\n--- 6. Historical Peak vs Current Streak ---");
  // 5 consecutive days in July, and 2 days currently (today + yesterday)
  const history = [
    "2026-07-10",
    "2026-07-11",
    "2026-07-12",
    "2026-07-13",
    "2026-07-14", // 5 days run
    twoDaysAgo, // gap at threeDaysAgo
    yesterday,
    today, // 3 days run
  ];
  const s6 = calculateHabitStreak(history, { today });
  assert(s6.currentStreak === 3, "Current streak is 3 (today, yesterday, twoDaysAgo)");
  assert(s6.longestStreak === 5, "Longest streak correctly reflects 5 days peak from July");

  // 7. Future dates filtering
  console.log("\n--- 7. Future Dates Discarded ---");
  const s7 = calculateHabitStreak([today, tomorrow, "2026-12-31"], { today });
  assert(s7.currentStreak === 1, "Future dates are ignored and do not inflate streak");
  assert(s7.totalCompletions === 1, "totalCompletions only counts past and today");

  // 8. Duplicate dates handling
  console.log("\n--- 8. Duplicate Date Deduplication ---");
  const s8 = calculateHabitStreak([today, today, today, yesterday, yesterday], { today });
  assert(s8.currentStreak === 2, "Duplicate entries are safely deduplicated to streak of 2");
  assert(s8.totalCompletions === 2, "totalCompletions is 2");

  // 9. Gap in the middle
  console.log("\n--- 9. Gap in Consecutive Sequence ---");
  // fourDaysAgo, threeDaysAgo, (gap at twoDaysAgo), yesterday, today
  const s9 = calculateHabitStreak([fourDaysAgo, threeDaysAgo, yesterday, today], { today });
  assert(s9.currentStreak === 2, "Current streak stopped at missed day (2 days)");
  assert(s9.longestStreak === 2, "Longest streak is 2");

  // 10. Weekly Target Days (e.g. Mon=1, Wed=3, Fri=5)
  console.log("\n--- 10. Weekly Target Days Schedule ---");
  // 2026-08-17 (Mon), 2026-08-19 (Wed), 2026-08-21 (Fri)
  const mwfHabit = calculateHabitStreak(["2026-08-17", "2026-08-19", "2026-08-21"], {
    today: "2026-08-23", // Sunday
    frequency: "weekly",
    targetDays: [1, 3, 5],
  });
  assert(mwfHabit.currentStreak === 3, "Weekly MWF habit achieved 3-target-day active streak");

  // 11. Rolling 7-Day Week History Builder
  console.log("\n--- 11. 7-Day Weekly History Matrix ---");
  const week = buildWeekHistory([today, twoDaysAgo], { today });
  assert(week.length === 7, "Week history generates exactly 7 days");
  assert(week[6].isToday === true, "Last element is today");
  assert(week[6].completed === true, "Today is marked completed");
  assert(week[5].completed === false, "Yesterday is marked not completed");
  assert(week[4].completed === true, "Two days ago is marked completed");

  console.log("\n=========================================");
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log("=========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runStreakEngineTests();
