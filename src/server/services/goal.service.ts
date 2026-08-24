import { z } from "zod";
import connectDB from "@/lib/db";
import { Goal, IGoalDocument } from "@/models/Goal";
import { Section } from "@/models/Section";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { escapeRegex, dateStringSchema } from "@/lib/utils";
import {
  GoalDTO,
  CreateGoalInput,
  UpdateGoalInput,
  GoalFilterOptions,
  SectionDTO,
  GoalStatus,
} from "@/types";
import mongoose from "mongoose";

export const CreateGoalSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Goal title is required")
      .max(120, "Goal title cannot exceed 120 characters"),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional()
      .default(""),
    sectionId: z.string().nullable().optional(),
    targetDate: dateStringSchema.nullable().optional(),
    currentValue: z.number().min(0, "Current progress cannot be negative").optional().default(0),
    targetValue: z.number().min(0.01, "Target value must be greater than 0").optional().default(100),
    unit: z.string().max(20, "Unit cannot exceed 20 characters").optional().default("%"),
  })
  .refine((data) => (data.currentValue ?? 0) <= (data.targetValue ?? 100), {
    message: "Current progress cannot exceed target value",
    path: ["currentValue"],
  });

export const UpdateGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Goal title is required")
    .max(120, "Goal title cannot exceed 120 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  sectionId: z.string().nullable().optional(),
  targetDate: dateStringSchema.nullable().optional(),
  currentValue: z.number().min(0, "Current progress cannot be negative").optional(),
  targetValue: z.number().min(0.01, "Target value must be greater than 0").optional(),
  unit: z.string().max(20, "Unit cannot exceed 20 characters").optional(),
  status: z.enum(["in_progress", "paused", "completed", "cancelled"]).optional(),
});

function toGoalDTO(doc: IGoalDocument, sectionMap?: Map<string, SectionDTO>): GoalDTO {
  const sectionIdStr = doc.sectionId ? doc.sectionId.toString() : null;
  const section = sectionIdStr && sectionMap ? sectionMap.get(sectionIdStr) || null : null;

  const rawPercent = doc.targetValue > 0 ? (doc.currentValue / doc.targetValue) * 100 : 0;
  const progressPercentage = Math.min(100, Math.max(0, Math.round(rawPercent)));

  let daysRemaining: number | null = null;
  if (doc.targetDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(doc.targetDate);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    sectionId: sectionIdStr,
    section,
    title: doc.title,
    description: doc.description || "",
    targetDate: doc.targetDate ? doc.targetDate.toISOString() : null,
    currentValue: doc.currentValue,
    targetValue: doc.targetValue,
    unit: doc.unit || "%",
    status: doc.status,
    progressPercentage,
    daysRemaining,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const goalService = {
  /**
   * Retrieves goals for a user with computed progress and days remaining.
   */
  async getGoals(userId: string, filters?: GoalFilterOptions): Promise<GoalDTO[]> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }

    await connectDB();
    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (filters?.status && filters.status !== "all") {
      query.status = filters.status;
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

    const goals = await Goal.find(query).sort({ createdAt: -1 }).exec();

    // Load sections
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

    return goals.map((g) => toGoalDTO(g, sectionMap));
  },

  /**
   * Retrieves an owned goal by ID.
   */
  async getGoalById(goalId: string, userId: string): Promise<GoalDTO | null> {
    if (
      !goalId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(goalId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return null;
    }

    await connectDB();
    const goal = await Goal.findOne({
      _id: new mongoose.Types.ObjectId(goalId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!goal) return null;

    let section: SectionDTO | null = null;
    if (goal.sectionId) {
      const sec = await Section.findOne({
        _id: goal.sectionId,
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

    return toGoalDTO(goal, sectionMap);
  },

  /**
   * Creates a new goal.
   */
  async createGoal(userId: string, input: CreateGoalInput): Promise<GoalDTO> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    const validated = CreateGoalSchema.parse(input);
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

    const targetDateObj = validated.targetDate ? new Date(validated.targetDate) : null;
    if (targetDateObj && isNaN(targetDateObj.getTime())) {
      throw new ValidationError("Invalid target date format");
    }

    const status =
      validated.currentValue >= validated.targetValue ? "completed" : "in_progress";

    const goal = await Goal.create({
      userId: new mongoose.Types.ObjectId(userId),
      sectionId: sectionObjectId,
      title: validated.title,
      description: validated.description,
      targetDate: targetDateObj,
      currentValue: validated.currentValue,
      targetValue: validated.targetValue,
      unit: validated.unit,
      status,
    });

    const map = new Map<string, SectionDTO>();
    if (sectionInfo) map.set(sectionInfo.id, sectionInfo);

    return toGoalDTO(goal, map);
  },

  /**
   * Updates an owned goal.
   */
  async updateGoal(
    goalId: string,
    userId: string,
    input: UpdateGoalInput
  ): Promise<GoalDTO> {
    if (
      !goalId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(goalId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new NotFoundError("Goal not found");
    }

    const validated = UpdateGoalSchema.parse(input);
    await connectDB();

    const existing = await Goal.findOne({
      _id: new mongoose.Types.ObjectId(goalId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!existing) {
      throw new NotFoundError("Goal not found");
    }

    const updates: Record<string, unknown> = {};

    if (validated.title !== undefined) updates.title = validated.title;
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.currentValue !== undefined) updates.currentValue = validated.currentValue;
    if (validated.targetValue !== undefined) updates.targetValue = validated.targetValue;
    if (validated.unit !== undefined) updates.unit = validated.unit;
    if (validated.status !== undefined) updates.status = validated.status;

    if (validated.targetDate !== undefined) {
      if (validated.targetDate === null || validated.targetDate === "") {
        updates.targetDate = null;
      } else {
        const d = new Date(validated.targetDate);
        if (isNaN(d.getTime())) {
          throw new ValidationError("Invalid target date");
        }
        updates.targetDate = d;
      }
    }

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

    // Validate that currentValue does not exceed targetValue unless status is deliberately set
    const nextCur =
      validated.currentValue !== undefined ? validated.currentValue : existing.currentValue;
    const nextTgt =
      validated.targetValue !== undefined ? validated.targetValue : existing.targetValue;
    if (nextCur > nextTgt) {
      throw new ValidationError("Current progress cannot exceed target value");
    }

    // Auto-update status to completed if current >= target unless explicitly changed
    if (validated.status === undefined) {
      if (nextCur >= nextTgt && existing.status === "in_progress") {
        updates.status = "completed";
      }
    }

    const updatedGoal = await Goal.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(goalId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    ).exec();

    if (!updatedGoal) {
      throw new NotFoundError("Goal not found");
    }

    return (await this.getGoalById(goalId, userId)) as GoalDTO;
  },

  /**
   * Toggles pause status of a goal (in_progress <-> paused).
   */
  async togglePauseGoal(goalId: string, userId: string): Promise<GoalDTO> {
    const goal = await this.getGoalById(goalId, userId);
    if (!goal) {
      throw new NotFoundError("Goal not found");
    }

    const nextStatus: GoalStatus =
      goal.status === "paused" ? "in_progress" : "paused";

    return this.updateGoal(goalId, userId, { status: nextStatus });
  },

  /**
   * Updates only current progress of a goal and auto-completes if target reached.
   */
  async updateGoalProgress(
    goalId: string,
    userId: string,
    currentValue: number
  ): Promise<GoalDTO> {
    if (typeof currentValue !== "number" || isNaN(currentValue) || currentValue < 0) {
      throw new ValidationError("Invalid progress value");
    }
    return this.updateGoal(goalId, userId, { currentValue });
  },

  /**
   * Marks a goal as completed and sets currentValue to targetValue.
   */
  async completeGoal(goalId: string, userId: string): Promise<GoalDTO> {
    const goal = await this.getGoalById(goalId, userId);
    if (!goal) {
      throw new NotFoundError("Goal not found");
    }

    return this.updateGoal(goalId, userId, {
      currentValue: goal.targetValue,
      status: "completed",
    });
  },

  /**
   * Deletes a goal.
   */
  async deleteGoal(goalId: string, userId: string): Promise<boolean> {
    if (
      !goalId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(goalId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new NotFoundError("Goal not found");
    }

    await connectDB();
    const goal = await Goal.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(goalId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!goal) {
      throw new NotFoundError("Goal not found");
    }

    return true;
  },
};
