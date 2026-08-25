import { taskService } from "@/server/services/task.service";
import { habitService } from "@/server/services/habit.service";
import { goalService } from "@/server/services/goal.service";
import { analyticsService } from "@/server/services/analytics.service";
import { dashboardService } from "@/server/services/dashboard.service";
import { sectionService } from "@/server/services/section.service";
import { formatDateKey } from "@/server/services/streak.service";
import { ValidationError } from "@/lib/errors";
import {
  AIResponseDTO,
  AIPriorityItem,
  AIQuickInsightsDTO,
  TaskDTO,
  HabitDTO,
  GoalDTO,
} from "@/types";
import mongoose from "mongoose";

const DEFAULT_MODEL = "google/gemini-3.7-flash";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

interface UserAIContext {
  currentDate: string;
  dayOfWeek: string;
  userSummary: {
    totalPendingTasks: number;
    totalCompletedTasks: number;
    totalActiveHabits: number;
    totalGoals: number;
    todayFocusMinutes: number;
    weeklyFocusMinutes: number;
    dailyCompletionRate: number;
  };
  tasks: {
    overdue: Array<{
      id: string;
      title: string;
      description?: string;
      priority: string;
      section?: string;
      dueDate: string;
      daysOverdue: number;
    }>;
    dueToday: Array<{
      id: string;
      title: string;
      description?: string;
      priority: string;
      section?: string;
    }>;
    upcoming: Array<{
      id: string;
      title: string;
      description?: string;
      priority: string;
      section?: string;
      dueDate: string;
    }>;
    noDueDate: Array<{
      id: string;
      title: string;
      description?: string;
      priority: string;
      section?: string;
    }>;
    recentlyCompleted: Array<{
      id: string;
      title: string;
      section?: string;
      completedAt: string;
    }>;
  };
  habits: Array<{
    id: string;
    title: string;
    frequency: string;
    section?: string;
    currentStreak: number;
    longestStreak: number;
    isCompletedToday: boolean;
    completionRatePast30Days: number;
  }>;
  goals: Array<{
    id: string;
    title: string;
    description?: string;
    section?: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    progressPercentage: number;
    targetDate?: string | null;
    daysRemaining?: number | null;
    status: string;
  }>;
  weeklyPerformance: {
    past7DaysMetrics: Array<{
      date: string;
      dayLabel: string;
      tasksCompleted: number;
      habitsCompleted: number;
      focusMinutes: number;
    }>;
    totalTasksCompleted7Days: number;
    totalHabitsCompleted7Days: number;
    totalFocusMinutes7Days: number;
    activeDaysCount7Days: number;
  };
  topFocusTags: Array<{ tag: string; focusMinutes: number }>;
}

export const aiService = {
  /**
   * Concurrently aggregates and pre-computes domain facts for the authenticated user.
   * Strips all internal secrets, passwords, and raw database identifiers.
   */
  async buildUserProgressContext(userId: string): Promise<UserAIContext> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    const todayDate = formatDateKey(new Date());
    const now = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = dayNames[now.getDay()];

    // Concurrently retrieve data from existing verified services
    const [allTasks, habits, goals, analytics, dashboardData, sections] =
      await Promise.all([
        taskService.getTasks(userId),
        habitService.getHabits(userId, { archived: false }),
        goalService.getGoals(userId),
        analyticsService.getAnalytics(userId),
        dashboardService.getDashboardData(userId),
        sectionService.getSections(userId),
      ]);

    const sectionNameMap = new Map<string, string>();
    sections.forEach((s) => sectionNameMap.set(s.id, s.name));

    // Categorize tasks based on due date and status
    const overdueTasks: UserAIContext["tasks"]["overdue"] = [];
    const dueTodayTasks: UserAIContext["tasks"]["dueToday"] = [];
    const upcomingTasks: UserAIContext["tasks"]["upcoming"] = [];
    const noDueDateTasks: UserAIContext["tasks"]["noDueDate"] = [];
    const recentlyCompletedTasks: UserAIContext["tasks"]["recentlyCompleted"] = [];

    const todayStart = new Date(`${todayDate}T00:00:00.000Z`);

    allTasks.forEach((t: TaskDTO) => {
      const sectionName = t.sectionId ? sectionNameMap.get(t.sectionId) || undefined : undefined;

      if (t.status === "completed") {
        if (t.completedAt) {
          recentlyCompletedTasks.push({
            id: t.id,
            title: t.title,
            section: sectionName,
            completedAt: t.completedAt,
          });
        }
        return;
      }

      // Pending task
      if (!t.dueDate) {
        noDueDateTasks.push({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          priority: t.priority,
          section: sectionName,
        });
      } else {
        const due = new Date(t.dueDate);
        const dueDateKey = formatDateKey(due);

        if (dueDateKey < todayDate) {
          const diffMs = todayStart.getTime() - new Date(`${dueDateKey}T00:00:00.000Z`).getTime();
          const daysOverdue = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
          overdueTasks.push({
            id: t.id,
            title: t.title,
            description: t.description || undefined,
            priority: t.priority,
            section: sectionName,
            dueDate: t.dueDate,
            daysOverdue,
          });
        } else if (dueDateKey === todayDate) {
          dueTodayTasks.push({
            id: t.id,
            title: t.title,
            description: t.description || undefined,
            priority: t.priority,
            section: sectionName,
          });
        } else {
          upcomingTasks.push({
            id: t.id,
            title: t.title,
            description: t.description || undefined,
            priority: t.priority,
            section: sectionName,
            dueDate: t.dueDate,
          });
        }
      }
    });

    // Format habits
    const formattedHabits = habits.map((h: HabitDTO) => {
      const secName = h.sectionId ? sectionNameMap.get(h.sectionId) || undefined : undefined;
      return {
        id: h.id,
        title: h.title,
        frequency: h.frequency,
        section: secName,
        currentStreak: h.streak.currentStreak,
        longestStreak: h.streak.longestStreak,
        isCompletedToday: h.streak.isCompletedToday,
        completionRatePast30Days: h.streak.completionRate || 0,
      };
    });

    // Format goals
    const formattedGoals = goals.map((g: GoalDTO) => {
      const secName = g.sectionId ? sectionNameMap.get(g.sectionId) || undefined : undefined;
      return {
        id: g.id,
        title: g.title,
        description: g.description || undefined,
        section: secName,
        currentValue: g.currentValue,
        targetValue: g.targetValue,
        unit: g.unit,
        progressPercentage: g.progressPercentage,
        targetDate: g.targetDate || null,
        daysRemaining: g.daysRemaining ?? null,
        status: g.status,
      };
    });

    return {
      currentDate: todayDate,
      dayOfWeek,
      userSummary: {
        totalPendingTasks: allTasks.filter((t) => t.status === "pending").length,
        totalCompletedTasks: allTasks.filter((t) => t.status === "completed").length,
        totalActiveHabits: habits.length,
        totalGoals: goals.length,
        todayFocusMinutes: dashboardData.todayActivitiesMinutes,
        weeklyFocusMinutes: analytics.weeklyOverview.totalFocusMinutes,
        dailyCompletionRate: dashboardData.dailyCompletionRate,
      },
      tasks: {
        overdue: overdueTasks,
        dueToday: dueTodayTasks,
        upcoming: upcomingTasks.slice(0, 15),
        noDueDate: noDueDateTasks.slice(0, 20),
        recentlyCompleted: recentlyCompletedTasks.slice(0, 10),
      },
      habits: formattedHabits,
      goals: formattedGoals,
      weeklyPerformance: {
        past7DaysMetrics: analytics.weeklyOverview.days.map((d) => ({
          date: d.date,
          dayLabel: d.dayLabel,
          tasksCompleted: d.tasksCompleted,
          habitsCompleted: d.habitsCompleted,
          focusMinutes: d.activityMinutes,
        })),
        totalTasksCompleted7Days: analytics.weeklyOverview.totalTasksCompleted,
        totalHabitsCompleted7Days: analytics.weeklyOverview.totalHabitsCompleted,
        totalFocusMinutes7Days: analytics.weeklyOverview.totalFocusMinutes,
        activeDaysCount7Days: analytics.weeklyOverview.activeDaysCount,
      },
      topFocusTags: analytics.activityStats.topTags.map((t) => ({
        tag: t.tag,
        focusMinutes: t.focusMinutes,
      })),
    };
  },

  /**
   * Main conversational interface.
   * Fetches the user's live context, injects strict grounding and prioritization instructions,
   * calls OpenRouter server-side, and parses the structured response.
   */
  async chatWithAssistant(
    userId: string,
    messages: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<AIResponseDTO> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError("Invalid user session");
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new ValidationError("At least one message is required");
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "your_openrouter_api_key_here") {
      throw new ValidationError(
        "OpenRouter API key is not configured on the server. Please set OPENROUTER_API_KEY in your environment."
      );
    }

    const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

    // 1. Build live user context
    const userContext = await this.buildUserProgressContext(userId);

    // 2. Formulate system prompt
    const systemPrompt = `You are the ProgressTracker AI Assistant — an intelligent, analytical, honest, and highly practical personal productivity partner.
You are embedded directly inside the user's personal ProgressTracker application.

TODAY'S DATE: ${userContext.currentDate} (${userContext.dayOfWeek})

AUTHENTICATED USER'S LIVE DATA CONTEXT:
${JSON.stringify(userContext, null, 2)}

CORE PRINCIPLES & RULES:
1. GROUNDING & HONESTY:
   - Base all statements, statistics, recommendations, and priorities ONLY on the actual data provided above.
   - NEVER hallucinate or invent tasks, habits, goals, deadlines, completion history, or numbers.
   - If the user asks about something not present in their data (e.g. "How is my workout goal?" when no workout goal exists), explicitly state that no such goal exists in their data.
   - If the user has 0 tasks or 0 habits, acknowledge it clearly and suggest creating one in the app instead of making up hypothetical tasks.

2. INTELLIGENT TASK PRIORITIZATION:
   - When asked what to work on, what to prioritize, or what to plan, evaluate tasks using:
     a) Overdue status (tasks overdue have highest urgency)
     b) Proximity of due dates (tasks due today or tomorrow)
     c) Goal alignment (tasks that advance in-progress goals)
     d) Priority levels (urgent > high > medium > low)
     e) Available user time (e.g. if the user says "I have 30 minutes", pick tasks that can realistically be done in 30 mins; if user has 3 hours, build a larger realistic sequence).
     f) Streak preservation (completing habits that risk breaking an active streak).
   - Explain the specific WHY for each recommendation. (e.g., "Finish Binary Trees first because it is overdue by 2 days and directly aligns with your DSA goal").
   - Do NOT overwhelm the user with an unrealistic workload.

3. CONCISE & ACTIONABLE:
   - Be analytical, crisp, and direct. Avoid generic productivity cliches like "remember to take deep breaths" when actual user data is waiting.

4. STRUCTURED JSON OUTPUT:
You MUST respond with a valid JSON object matching this exact schema:
{
  "answer": "Comprehensive, nicely formatted markdown answer addressing the user's specific prompt.",
  "summary": "Crisp 1-2 sentence executive summary of the advice or analysis.",
  "priorities": [
    {
      "taskId": "task-id-if-existing-in-data-or-empty-string",
      "taskTitle": "Exact task title from data or suggested action",
      "priority": "critical" | "high" | "medium" | "low",
      "reason": "Clear explanation why this is prioritized now",
      "estimatedMinutes": 30
    }
  ],
  "insights": [
    "Key analytical observation based on real user numbers (e.g. 'You completed 12 tasks this week, up 20% vs last week')"
  ],
  "warnings": [
    "Urgent risk callout (e.g. 'You have 2 overdue tasks' or 'Your 5-day habit streak is at risk today')"
  ],
  "suggestedActions": [
    "Direct concrete next step"
  ]
}

Return ONLY raw JSON. No markdown backticks wrapping the whole JSON response if possible.`;

    // 3. Format messages payload for OpenRouter
    const chatPayload = {
      model,
      max_tokens: 2500,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content.slice(0, 3000), // sanitize max length
        })),
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    };

    // 4. Execute server-side fetch with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
          "X-Title": "ProgressTracker AI Assistant",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error response:", response.status, errorText);

        if (response.status === 401) {
          throw new ValidationError("Invalid OpenRouter API Key. Please verify your server credentials.");
        } else if (response.status === 429) {
          throw new ValidationError("OpenRouter rate limit reached. Please try again in a few moments.");
        } else {
          throw new Error(`OpenRouter API returned HTTP ${response.status}: ${errorText.slice(0, 200)}`);
        }
      }

      const responseJson = await response.json();
      const rawContent = responseJson?.choices?.[0]?.message?.content;

      if (!rawContent) {
        throw new Error("Received empty response from AI model.");
      }

      // 5. Parse and validate structured output
      return this.parseStructuredAIResponse(rawContent);
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new ValidationError("AI request timed out. Please try again with a shorter request.");
      }
      console.error("aiService.chatWithAssistant error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to communicate with AI Assistant. Please check network connection."
      );
    }
  },

  /**
   * Safely parses and normalizes the AI JSON response with fallback tolerance.
   */
  parseStructuredAIResponse(rawText: string): AIResponseDTO {
    let cleanText = rawText.trim();

    // Strip markdown codeblocks if present (e.g. ```json ... ```)
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
      const parsed = JSON.parse(cleanText);

      const answer = typeof parsed.answer === "string" ? parsed.answer : rawText;
      const summary = typeof parsed.summary === "string" ? parsed.summary : answer.slice(0, 140);

      const rawPriorities = Array.isArray(parsed.priorities) ? parsed.priorities : [];
      const priorities: AIPriorityItem[] = rawPriorities.map((p: Record<string, unknown>) => ({
        taskId: typeof p.taskId === "string" ? p.taskId : undefined,
        taskTitle: typeof p.taskTitle === "string" ? p.taskTitle : "Prioritized Action",
        priority: ["critical", "high", "medium", "low"].includes(p.priority as string)
          ? (p.priority as AIPriorityItem["priority"])
          : "medium",
        reason: typeof p.reason === "string" ? p.reason : "Recommended by AI analysis",
        estimatedMinutes: typeof p.estimatedMinutes === "number" ? p.estimatedMinutes : undefined,
      }));

      const insights = Array.isArray(parsed.insights)
        ? (parsed.insights as unknown[]).filter((i: unknown): i is string => typeof i === "string")
        : [];
      const warnings = Array.isArray(parsed.warnings)
        ? (parsed.warnings as unknown[]).filter((w: unknown): w is string => typeof w === "string")
        : [];
      const suggestedActions = Array.isArray(parsed.suggestedActions)
        ? (parsed.suggestedActions as unknown[]).filter((a: unknown): a is string => typeof a === "string")
        : [];

      return {
        answer,
        summary,
        priorities,
        insights,
        warnings,
        suggestedActions,
      };
    } catch {
      // Fallback if model returned plain text instead of strict JSON
      return {
        answer: rawText,
        summary: rawText.slice(0, 140) + "...",
        priorities: [],
        insights: [],
        warnings: [],
        suggestedActions: [],
      };
    }
  },

  /**
   * Fast rule-based + factual snapshot insights for the dashboard banner.
   */
  async getQuickInsights(userId: string): Promise<AIQuickInsightsDTO> {
    const context = await this.buildUserProgressContext(userId);

    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 17) greeting = "Good afternoon";

    const highlights: string[] = [];

    // Overdue tasks highlight
    if (context.tasks.overdue.length > 0) {
      highlights.push(
        `⚠️ You have ${context.tasks.overdue.length} overdue ${
          context.tasks.overdue.length === 1 ? "task" : "tasks"
        } needing immediate attention.`
      );
    }

    // Streaks highlight
    const bestStreak = context.habits.reduce(
      (best, h) => (h.currentStreak > (best?.currentStreak || 0) ? h : best),
      null as (typeof context.habits)[0] | null
    );

    if (bestStreak && bestStreak.currentStreak > 0) {
      highlights.push(
        `🔥 "${bestStreak.title}" is on an active ${bestStreak.currentStreak}-day streak!`
      );
    }

    // Weekly completion highlight
    if (context.weeklyPerformance.totalTasksCompleted7Days > 0) {
      highlights.push(
        `✅ You completed ${context.weeklyPerformance.totalTasksCompleted7Days} tasks and ${context.weeklyPerformance.totalHabitsCompleted7Days} habit check-ins this week.`
      );
    }

    // Goals highlight
    const topGoal = context.goals.find((g) => g.status === "in_progress");
    if (topGoal) {
      highlights.push(
        `🎯 Goal "${topGoal.title}" is at ${topGoal.progressPercentage}% progress.`
      );
    }

    if (highlights.length === 0) {
      highlights.push(
        "🚀 Ready for a productive session! Create your first task or habit to track progress."
      );
    }

    let recommendation = "Review today's scheduled tasks and maintain your momentum.";
    if (context.tasks.overdue.length > 0) {
      recommendation = `Prioritize completing "${context.tasks.overdue[0].title}" first to clear your overdue backlog.`;
    } else if (context.tasks.dueToday.length > 0) {
      recommendation = `Focus on completing your ${context.tasks.dueToday.length} task(s) due today.`;
    } else if (bestStreak && !bestStreak.isCompletedToday) {
      recommendation = `Complete "${bestStreak.title}" today to keep your ${bestStreak.currentStreak}-day streak alive.`;
    }

    return {
      greeting,
      highlights,
      urgentTasksCount: context.tasks.overdue.length + context.tasks.dueToday.length,
      overdueTasksCount: context.tasks.overdue.length,
      bestStreakHabit: bestStreak ? bestStreak.title : null,
      bestStreakDays: bestStreak ? bestStreak.currentStreak : 0,
      dailyRate: context.userSummary.dailyCompletionRate,
      weeklyTasksDone: context.weeklyPerformance.totalTasksCompleted7Days,
      recommendation,
    };
  },
};
