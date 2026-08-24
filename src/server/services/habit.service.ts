import { z } from "zod";
import connectDB from "@/lib/db";
import { Habit, IHabitDocument } from "@/models/Habit";
import { HabitLog } from "@/models/HabitLog";
import { Section } from "@/models/Section";
import { activityService } from "@/server/services/activity.service";
import {
  calculateHabitStreak,
  buildWeekHistory,
  formatDateKey,
} from "@/server/services/streak.service";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { escapeRegex } from "@/lib/utils";
import {
  HabitDTO,
  CreateHabitInput,
  UpdateHabitInput,
  HabitFilterOptions,
  SectionDTO,
} from "@/types";
import mongoose from "mongoose";

export const CreateHabitSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Habit title is required")
    .max(100, "Habit title cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),
  sectionId: z.string().nullable().optional(),
  frequency: z.enum(["daily", "weekly"]).optional().default("daily"),
  targetDays: z
    .array(z.number().min(0).max(6))
    .optional()
    .default([0, 1, 2, 3, 4, 5, 6]),
});

export const UpdateHabitSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Habit title is required")
    .max(100, "Habit title cannot exceed 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  sectionId: z.string().nullable().optional(),
  frequency: z.enum(["daily", "weekly"]).optional(),
  targetDays: z.array(z.number().min(0).max(6)).optional(),
  archived: z.boolean().optional(),
});

function toHabitDTO(
  doc: IHabitDocument,
  logDates: string[],
  sectionMap?: Map<string, SectionDTO>,
  todayStr?: string
): HabitDTO {
  const sectionIdStr = doc.sectionId ? doc.sectionId.toString() : null;
  const section = sectionIdStr && sectionMap ? sectionMap.get(sectionIdStr) || null : null;

  const streak = calculateHabitStreak(logDates, {
    today: todayStr,
    frequency: doc.frequency,
    targetDays: doc.targetDays,
  });

  const weekHistory = buildWeekHistory(logDates, {
    today: todayStr,
    targetDays: doc.targetDays,
  });

  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    sectionId: sectionIdStr,
    section,
    title: doc.title,
    description: doc.description || "",
    frequency: doc.frequency,
    targetDays: doc.targetDays,
    archived: doc.archived,
    streak,
    weekHistory,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const habitService = {
  /**
   * Retrieves habits for a user with streaks calculated dynamically from habit_logs.
   */
  async getHabits(
    userId: string,
    filters?: HabitFilterOptions
  ): Promise<HabitDTO[]> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }

    await connectDB();
    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (filters?.archived !== undefined) {
      query.archived = filters.archived;
    } else {
      query.archived = false; // Default to active habits
    }

    if (filters?.sectionId && filters.sectionId !== "all") {
      if (mongoose.Types.ObjectId.isValid(filters.sectionId)) {
        query.sectionId = new mongoose.Types.ObjectId(filters.sectionId);
      }
    }

    if (filters?.search && filters.search.trim()) {
      const searchRegex = new RegExp(escapeRegex(filters.search.trim()), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const habits = await Habit.find(query).sort({ createdAt: -1 }).exec();

    // Fetch all habit logs for this user to calculate streaks
    const habitIds = habits.map((h) => h._id);
    const logs = await HabitLog.find({
      habitId: { $in: habitIds },
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    const logsMap = new Map<string, string[]>();
    logs.forEach((log) => {
      const hId = log.habitId.toString();
      if (!logsMap.has(hId)) {
        logsMap.set(hId, []);
      }
      logsMap.get(hId)!.push(log.date);
    });

    // Fetch sections for metadata
    const sections = await Section.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    const sectionMap = new Map<string, SectionDTO>();
    sections.forEach((s) => {
      sectionMap.set(s._id.toString(), {
        id: s._id.toString(),
        userId: s.userId.toString(),
        name: s.name,
        description: s.description || "",
        color: s.color,
        order: s.order,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      });
    });

    const todayStr = formatDateKey(new Date());
    return habits.map((h) =>
      toHabitDTO(h, logsMap.get(h._id.toString()) || [], sectionMap, todayStr)
    );
  },

  /**
   * Retrieves a single owned habit by ID with calculated streak and week matrix.
   */
  async getHabitById(
    habitId: string,
    userId: string
  ): Promise<HabitDTO | null> {
    if (
      !habitId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(habitId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return null;
    }

    await connectDB();
    const habit = await Habit.findOne({
      _id: new mongoose.Types.ObjectId(habitId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!habit) return null;

    const logs = await HabitLog.find({
      habitId: habit._id,
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();
    const logDates = logs.map((l) => l.date);

    let section: SectionDTO | null = null;
    if (habit.sectionId) {
      const sec = await Section.findOne({
        _id: habit.sectionId,
        userId: new mongoose.Types.ObjectId(userId),
      }).exec();
      if (sec) {
        section = {
          id: sec._id.toString(),
          userId: sec.userId.toString(),
          name: sec.name,
          description: sec.description || "",
          color: sec.color,
          order: sec.order,
          createdAt: sec.createdAt.toISOString(),
          updatedAt: sec.updatedAt.toISOString(),
        };
      }
    }

    const sectionMap = new Map<string, SectionDTO>();
    if (section) sectionMap.set(section.id, section);

    return toHabitDTO(habit, logDates, sectionMap);
  },

  /**
   * Creates a new habit. Validates section ownership if sectionId is provided.
   */
  async createHabit(userId: string, input: CreateHabitInput): Promise<HabitDTO> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    const validated = CreateHabitSchema.parse(input);
    await connectDB();

    let sectionObjectId: mongoose.Types.ObjectId | null = null;
    let sectionInfo: SectionDTO | null = null;

    if (validated.sectionId) {
      if (!mongoose.Types.ObjectId.isValid(validated.sectionId)) {
        throw new ValidationError("Invalid Section ID");
      }
      const section = await Section.findOne({
        _id: new mongoose.Types.ObjectId(validated.sectionId),
        userId: new mongoose.Types.ObjectId(userId),
      }).exec();

      if (!section) {
        throw new ValidationError("Section not found or does not belong to you");
      }
      sectionObjectId = section._id as mongoose.Types.ObjectId;
      sectionInfo = {
        id: section._id.toString(),
        userId: section.userId.toString(),
        name: section.name,
        description: section.description || "",
        color: section.color,
        order: section.order,
        createdAt: section.createdAt.toISOString(),
        updatedAt: section.updatedAt.toISOString(),
      };
    }

    const targetDays =
      validated.frequency === "daily"
        ? [0, 1, 2, 3, 4, 5, 6]
        : validated.targetDays.length > 0
        ? validated.targetDays
        : [0, 1, 2, 3, 4, 5, 6];

    const habit = await Habit.create({
      userId: new mongoose.Types.ObjectId(userId),
      sectionId: sectionObjectId,
      title: validated.title,
      description: validated.description,
      frequency: validated.frequency,
      targetDays,
      archived: false,
    });

    const map = new Map<string, SectionDTO>();
    if (sectionInfo) map.set(sectionInfo.id, sectionInfo);

    return toHabitDTO(habit, [], map);
  },

  /**
   * Updates an owned habit.
   */
  async updateHabit(
    habitId: string,
    userId: string,
    input: UpdateHabitInput
  ): Promise<HabitDTO> {
    if (
      !habitId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(habitId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new NotFoundError("Habit not found");
    }

    const validated = UpdateHabitSchema.parse(input);
    await connectDB();

    const existing = await Habit.findOne({
      _id: new mongoose.Types.ObjectId(habitId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!existing) {
      throw new NotFoundError("Habit not found");
    }

    const updates: Record<string, unknown> = {};

    if (validated.title !== undefined) updates.title = validated.title;
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.frequency !== undefined) updates.frequency = validated.frequency;
    if (validated.targetDays !== undefined) updates.targetDays = validated.targetDays;
    if (validated.archived !== undefined) updates.archived = validated.archived;

    if (validated.sectionId !== undefined) {
      if (validated.sectionId === null || validated.sectionId === "") {
        updates.sectionId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(validated.sectionId)) {
          throw new ValidationError("Invalid Section ID");
        }
        const section = await Section.findOne({
          _id: new mongoose.Types.ObjectId(validated.sectionId),
          userId: new mongoose.Types.ObjectId(userId),
        }).exec();

        if (!section) {
          throw new ValidationError("Section not found or does not belong to you");
        }
        updates.sectionId = section._id;
      }
    }

    const updatedHabit = await Habit.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(habitId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    ).exec();

    if (!updatedHabit) {
      throw new NotFoundError("Habit not found");
    }

    return (await this.getHabitById(habitId, userId)) as HabitDTO;
  },

  /**
   * Toggles habit completion for a specific date (defaults to today).
   * Idempotent, updates activities audit trail, and recalculates streak.
   */
  async toggleHabitLog(
    habitId: string,
    userId: string,
    dateStr?: string
  ): Promise<{ habit: HabitDTO; completed: boolean }> {
    if (
      !habitId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(habitId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new NotFoundError("Habit not found");
    }

    const targetDate = dateStr || formatDateKey(new Date());
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(targetDate) ||
      isNaN(new Date(`${targetDate}T00:00:00`).getTime())
    ) {
      throw new ValidationError("Invalid date format. Must be YYYY-MM-DD");
    }

    await connectDB();
    const habit = await Habit.findOne({
      _id: new mongoose.Types.ObjectId(habitId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!habit) {
      throw new NotFoundError("Habit not found");
    }

    // Check if log already exists
    const existingLog = await HabitLog.findOne({
      habitId: habit._id,
      userId: new mongoose.Types.ObjectId(userId),
      date: targetDate,
    }).exec();

    let completed = false;

    if (existingLog) {
      // Uncheck habit
      await HabitLog.deleteOne({
        _id: existingLog._id,
        userId: new mongoose.Types.ObjectId(userId),
      }).exec();
      // Remove corresponding activity record
      await activityService.removeActivityByRef(userId, habitId, "habit_completed");
      completed = false;
    } else {
      // Check in habit
      try {
        await HabitLog.create({
          habitId: habit._id,
          userId: new mongoose.Types.ObjectId(userId),
          date: targetDate,
          completed: true,
        });
      } catch (err: unknown) {
        // Handle duplicate key edge case gracefully
        if (typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000) {
          // Already logged
        } else {
          throw err;
        }
      }

      // Log to activities collection
      await activityService.logActivity(userId, {
        type: "habit_completed",
        refId: habitId,
        sectionId: habit.sectionId?.toString() || null,
        title: habit.title,
        occurredAt: new Date(`${targetDate}T12:00:00Z`),
      });
      completed = true;
    }

    const updatedHabit = await this.getHabitById(habitId, userId);
    return {
      habit: updatedHabit!,
      completed,
    };
  },

  /**
   * Toggles archive status of a habit.
   */
  async archiveHabit(
    habitId: string,
    userId: string,
    archived = true
  ): Promise<HabitDTO> {
    return this.updateHabit(habitId, userId, { archived });
  },

  /**
   * Deletes a habit and cleans up all associated habit logs and activity entries.
   */
  async deleteHabit(habitId: string, userId: string): Promise<boolean> {
    if (
      !habitId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(habitId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new NotFoundError("Habit not found");
    }

    await connectDB();
    const habit = await Habit.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(habitId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!habit) {
      throw new NotFoundError("Habit not found");
    }

    // Clean up habit logs scoped strictly to user and habit
    await HabitLog.deleteMany({
      habitId: habit._id,
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    // Clean up activity entries
    await activityService.removeActivityByRef(userId, habitId, "habit_completed");

    return true;
  },
};
