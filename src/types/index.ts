export interface IUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
}

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface ISection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionDTO {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionInput {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateSectionInput {
  name?: string;
  description?: string;
  color?: string;
  order?: number;
}

export type TaskStatus = "pending" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface ITask {
  id: string;
  userId: string;
  sectionId?: string | null;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDTO {
  id: string;
  userId: string;
  sectionId?: string | null;
  section?: SectionDTO | null;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  sectionId?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  sectionId?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  status?: TaskStatus;
}

export interface TaskFilterOptions {
  status?: TaskStatus | "all";
  sectionId?: string | "all";
  priority?: TaskPriority | "all";
  search?: string;
}

export type ActivityType = "manual_entry" | "task_completed" | "habit_completed";

export interface IActivity {
  id: string;
  userId: string;
  type: ActivityType;
  refId?: string | null;
  sectionId?: string | null;
  title: string;
  description?: string;
  duration?: number; // In minutes
  tags: string[];
  occurredAt: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ActivityDTO {
  id: string;
  userId: string;
  type: ActivityType;
  refId?: string | null;
  sectionId?: string | null;
  section?: SectionDTO | null;
  title: string;
  description?: string;
  duration?: number;
  tags: string[];
  occurredAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateActivityInput {
  title: string;
  description?: string;
  sectionId?: string | null;
  duration?: number;
  occurredAt?: string | null;
  tags?: string[];
  type?: ActivityType;
  refId?: string | null;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string;
  sectionId?: string | null;
  duration?: number;
  occurredAt?: string | null;
  tags?: string[];
}

export interface ActivityFilterOptions {
  sectionId?: string | "all";
  tag?: string;
  search?: string;
  from?: string;
  to?: string;
  type?: ActivityType | "all";
  limit?: number;
}

export type HabitFrequency = "daily" | "weekly";

export interface IHabit {
  id: string;
  userId: string;
  sectionId?: string | null;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetDays: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: Date;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  isCompletedToday: boolean;
  totalCompletions: number;
  completionRate?: number; // e.g. percentage over last 30 days
}

export interface HabitDayStatus {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Mon", "Tue"
  dayNumber: number; // e.g. 24
  isToday: boolean;
  isTargetDay: boolean;
  completed: boolean;
}

export interface HabitDTO {
  id: string;
  userId: string;
  sectionId?: string | null;
  section?: SectionDTO | null;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetDays: number[];
  archived: boolean;
  streak: StreakInfo;
  weekHistory: HabitDayStatus[]; // Last 7 days
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitInput {
  title: string;
  description?: string;
  sectionId?: string | null;
  frequency?: HabitFrequency;
  targetDays?: number[];
}

export interface UpdateHabitInput {
  title?: string;
  description?: string;
  sectionId?: string | null;
  frequency?: HabitFrequency;
  targetDays?: number[];
  archived?: boolean;
}

export interface HabitFilterOptions {
  sectionId?: string | "all";
  archived?: boolean;
  search?: string;
}

export type GoalStatus = "in_progress" | "paused" | "completed" | "cancelled";

export interface IGoal {
  id: string;
  userId: string;
  sectionId?: string | null;
  title: string;
  description?: string;
  targetDate?: Date | null;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalDTO {
  id: string;
  userId: string;
  sectionId?: string | null;
  section?: SectionDTO | null;
  title: string;
  description?: string;
  targetDate?: string | null;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: GoalStatus;
  progressPercentage: number;
  daysRemaining?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  sectionId?: string | null;
  targetDate?: string | null;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  sectionId?: string | null;
  targetDate?: string | null;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  status?: GoalStatus;
}

export interface GoalFilterOptions {
  sectionId?: string | "all";
  status?: GoalStatus | "all";
  search?: string;
}

export interface WeeklyDayMetric {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Mon", "Tue", etc.
  dayNumber: number;
  isToday: boolean;
  activityMinutes: number;
  tasksCompleted: number;
  habitsCompleted: number;
}

export interface DashboardDataDTO {
  todayDate: string;
  dailyCompletionRate: number; // 0 to 100
  todayTasksTotal: number;
  todayTasksCompleted: number;
  todayHabitsTotal: number;
  todayHabitsCompleted: number;
  todayActivitiesMinutes: number;
  todayActivitiesCount: number;
  todayTasks: TaskDTO[];
  completedTasks: TaskDTO[];
  todayActivities: ActivityDTO[];
  activeHabits: HabitDTO[];
  goals: GoalDTO[];
  recentActivities: ActivityDTO[];
  weeklyMetrics: WeeklyDayMetric[];
}

export interface DayHistoryDTO {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Sun", "Mon", etc.
  dayNumber: number;
  isToday: boolean;
  dailyCompletionRate: number; // 0 - 100
  totalFocusMinutes: number;
  totalActivitiesCount: number;
  tasksCompleted: TaskDTO[];
  habitsCompleted: HabitDTO[];
  habitsScheduledCount: number;
  activities: ActivityDTO[];
  goalsUpdated: GoalDTO[];
}

export interface DaySummaryDTO {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  dayLabel: string;
  isToday: boolean;
  dailyCompletionRate: number;
  tasksCompletedCount: number;
  habitsCompletedCount: number;
  activitiesCount: number;
  focusMinutes: number;
  hasActivity: boolean;
}

export interface MonthHistoryDTO {
  yearMonth: string; // YYYY-MM
  monthName: string; // "August 2026"
  days: DaySummaryDTO[];
  totalFocusMinutes: number;
  totalTasksCompleted: number;
  totalHabitsCompleted: number;
  activeDaysCount: number;
}

export interface TaskPriorityBreakdown {
  priority: TaskPriority;
  total: number;
  completed: number;
  completionRate: number;
}

export interface SectionBreakdownItem {
  sectionId: string;
  sectionName: string;
  color: string;
  tasksCompleted: number;
  focusMinutes: number;
  activityCount: number;
}

export interface TagBreakdownItem {
  tag: string;
  count: number;
  focusMinutes: number;
}

export interface HabitPerformanceItem {
  id: string;
  title: string;
  frequency: HabitFrequency;
  section?: SectionDTO;
  currentStreak: number;
  longestStreak: number;
  past30DaysLogsCount: number;
  past30DaysScheduledCount: number;
  completionRate: number; // 0 - 100
}

export interface WeeklyOverviewDTO {
  days: WeeklyDayMetric[];
  totalTasksCompleted: number;
  totalHabitsCompleted: number;
  totalFocusMinutes: number;
  totalActivitiesCount: number;
  activeDaysCount: number;
  averageDailyCompletionRate: number;
}

export interface MonthlyWeekTrend {
  weekLabel: string; // "Week 1", "Week 2", etc.
  startDate: string;
  endDate: string;
  tasksCompleted: number;
  habitsCompleted: number;
  focusMinutes: number;
  activeDaysCount: number;
}

export interface MonthlyOverviewDTO {
  totalTasksCompleted: number;
  totalHabitsCompleted: number;
  totalFocusMinutes: number;
  totalActivitiesCount: number;
  activeDaysCount: number;
  consistencyRate: number; // active days / 30 * 100
  weekTrends: MonthlyWeekTrend[];
}

export interface TaskStatsDTO {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number; // 0 - 100
  priorityBreakdown: TaskPriorityBreakdown[];
  sectionBreakdown: SectionBreakdownItem[];
}

export interface HabitStatsDTO {
  totalHabits: number;
  totalLogsAllTime: number;
  totalLogsPast30Days: number;
  overallCompletionRate: number; // scheduled vs logged past 30 days
  habitsPerformance: HabitPerformanceItem[];
}

export interface StreakStatsDTO {
  bestCurrentStreak: number;
  bestCurrentHabitTitle: string | null;
  bestLongestStreak: number;
  bestLongestHabitTitle: string | null;
  averageCurrentStreak: number;
}

export interface ActivityStatsDTO {
  totalActivitiesAllTime: number;
  totalActivitiesPast30Days: number;
  totalActivitiesPast7Days: number;
  totalDurationMinutesAllTime: number;
  totalDurationMinutesPast30Days: number;
  totalDurationMinutesPast7Days: number;
  averageSessionMinutes: number;
  sectionBreakdown: SectionBreakdownItem[];
  topTags: TagBreakdownItem[];
}

export interface GoalStatsDTO {
  totalGoals: number;
  inProgressGoals: number;
  completedGoals: number;
  pausedGoals: number;
  completionRate: number; // completed / total * 100
  averageProgressPercentage: number;
  goals: GoalDTO[];
}

export interface ActiveDaysStatsDTO {
  activeDaysAllTime: number;
  activeDaysPast30Days: number;
  activeDaysPast7Days: number;
  consistencyScore: number; // 0 - 100
}

export interface AnalyticsDTO {
  weeklyOverview: WeeklyOverviewDTO;
  monthlyOverview: MonthlyOverviewDTO;
  taskStats: TaskStatsDTO;
  habitStats: HabitStatsDTO;
  streakStats: StreakStatsDTO;
  activityStats: ActivityStatsDTO;
  goalStats: GoalStatsDTO;
  activeDaysStats: ActiveDaysStatsDTO;
}

export type AIPriorityLevel = "critical" | "high" | "medium" | "low";

export interface AIPriorityItem {
  taskId?: string;
  taskTitle: string;
  priority: AIPriorityLevel;
  reason: string;
  estimatedMinutes?: number;
  goalTitle?: string;
  isOverdue?: boolean;
}

export interface AIResponseDTO {
  answer: string;
  summary: string;
  priorities: AIPriorityItem[];
  insights: string[];
  warnings: string[];
  suggestedActions: string[];
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  structuredData?: AIResponseDTO;
  createdAt: string;
}

export interface AIChatRequestInput {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface AIQuickInsightsDTO {
  greeting: string;
  highlights: string[];
  urgentTasksCount: number;
  overdueTasksCount: number;
  bestStreakHabit?: string | null;
  bestStreakDays?: number;
  dailyRate: number;
  weeklyTasksDone: number;
  recommendation: string;
}

