import { z } from "zod";
import connectDB from "@/lib/db";
import { Activity, IActivityDocument } from "@/models/Activity";
import { Section } from "@/models/Section";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  ActivityDTO,
  ActivityType,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityFilterOptions,
  SectionDTO,
} from "@/types";
import mongoose from "mongoose";

export const CreateActivitySchema = z.object({
  title: z
    .string()
    .min(1, "Activity title is required")
    .max(100, "Activity title cannot exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),
  sectionId: z.string().nullable().optional(),
  duration: z
    .number()
    .min(0, "Duration cannot be negative")
    .max(1440, "Duration cannot exceed 1440 minutes")
    .optional()
    .default(0),
  occurredAt: z.string().nullable().optional(),
  tags: z.array(z.string().trim()).optional().default([]),
  type: z.enum(["manual_entry", "task_completed", "habit_completed"]).optional().default("manual_entry"),
  refId: z.string().nullable().optional(),
});

export const UpdateActivitySchema = z.object({
  title: z
    .string()
    .min(1, "Activity title is required")
    .max(100, "Activity title cannot exceed 100 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  sectionId: z.string().nullable().optional(),
  duration: z
    .number()
    .min(0, "Duration cannot be negative")
    .max(1440, "Duration cannot exceed 1440 minutes")
    .optional(),
  occurredAt: z.string().nullable().optional(),
  tags: z.array(z.string().trim()).optional(),
});

function toActivityDTO(
  doc: IActivityDocument,
  sectionMap?: Map<string, SectionDTO>
): ActivityDTO {
  const sectionIdStr = doc.sectionId ? doc.sectionId.toString() : null;
  const section = sectionIdStr && sectionMap ? sectionMap.get(sectionIdStr) || null : null;

  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    refId: doc.refId ? doc.refId.toString() : null,
    sectionId: sectionIdStr,
    section,
    title: doc.title,
    description: doc.description || "",
    duration: doc.duration || 0,
    tags: doc.tags || [],
    occurredAt: doc.occurredAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : undefined,
  };
}

export const activityService = {
  /**
   * Retrieves activities for a user with flexible filtering (section, tag, search, date range, type).
   */
  async getActivities(
    userId: string,
    filters?: ActivityFilterOptions
  ): Promise<ActivityDTO[]> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }

    await connectDB();
    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (filters?.sectionId && filters.sectionId !== "all") {
      if (mongoose.Types.ObjectId.isValid(filters.sectionId)) {
        query.sectionId = new mongoose.Types.ObjectId(filters.sectionId);
      }
    }

    if (filters?.type && filters.type !== "all") {
      query.type = filters.type;
    }

    if (filters?.tag && filters.tag.trim()) {
      query.tags = filters.tag.trim().toLowerCase();
    }

    if (filters?.search && filters.search.trim()) {
      const searchRegex = new RegExp(filters.search.trim(), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }, { tags: searchRegex }];
    }

    if (filters?.from || filters?.to) {
      const dateQuery: Record<string, Date> = {};
      if (filters.from) dateQuery.$gte = new Date(filters.from);
      if (filters.to) dateQuery.$lte = new Date(filters.to);
      query.occurredAt = dateQuery;
    }

    const limit = filters?.limit || 100;

    const activities = await Activity.find(query)
      .sort({ occurredAt: -1, createdAt: -1 })
      .limit(limit)
      .exec();

    // Fetch user sections to attach details
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

    return activities.map((a) => toActivityDTO(a, sectionMap));
  },

  /**
   * Retrieves a single owned activity by ID.
   */
  async getActivityById(
    activityId: string,
    userId: string
  ): Promise<ActivityDTO | null> {
    if (
      !activityId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(activityId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return null;
    }

    await connectDB();
    const activity = await Activity.findOne({
      _id: new mongoose.Types.ObjectId(activityId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!activity) return null;

    let section: SectionDTO | null = null;
    if (activity.sectionId) {
      const sec = await Section.findOne({
        _id: activity.sectionId,
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

    const map = new Map<string, SectionDTO>();
    if (section) map.set(section.id, section);
    return toActivityDTO(activity, map);
  },

  /**
   * Creates a new manual activity log entry. Validates section ownership if sectionId is provided.
   */
  async createActivity(
    userId: string,
    input: CreateActivityInput
  ): Promise<ActivityDTO> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    const validated = CreateActivitySchema.parse(input);
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

    // Clean and normalize tags
    const normalizedTags = Array.from(
      new Set(
        validated.tags
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0)
      )
    );

    const occurredAt = validated.occurredAt
      ? new Date(validated.occurredAt)
      : new Date();

    const activity = await Activity.create({
      userId: new mongoose.Types.ObjectId(userId),
      type: validated.type || "manual_entry",
      refId: validated.refId && mongoose.Types.ObjectId.isValid(validated.refId)
        ? new mongoose.Types.ObjectId(validated.refId)
        : null,
      sectionId: sectionObjectId,
      title: validated.title,
      description: validated.description,
      duration: validated.duration || 0,
      tags: normalizedTags,
      occurredAt,
    });

    const map = new Map<string, SectionDTO>();
    if (sectionInfo) map.set(sectionInfo.id, sectionInfo);
    return toActivityDTO(activity, map);
  },

  /**
   * Updates an owned activity log entry.
   */
  async updateActivity(
    activityId: string,
    userId: string,
    input: UpdateActivityInput
  ): Promise<ActivityDTO> {
    if (
      !activityId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(activityId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new NotFoundError("Activity not found");
    }

    const validated = UpdateActivitySchema.parse(input);
    await connectDB();

    const existing = await Activity.findOne({
      _id: new mongoose.Types.ObjectId(activityId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!existing) {
      throw new NotFoundError("Activity not found");
    }

    const updates: Record<string, unknown> = {};

    if (validated.title !== undefined) updates.title = validated.title;
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.duration !== undefined) updates.duration = validated.duration;
    if (validated.occurredAt !== undefined) {
      updates.occurredAt = validated.occurredAt
        ? new Date(validated.occurredAt)
        : existing.occurredAt;
    }

    if (validated.tags !== undefined) {
      updates.tags = Array.from(
        new Set(
          validated.tags
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t.length > 0)
        )
      );
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

    const updated = await Activity.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(activityId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    ).exec();

    if (!updated) {
      throw new NotFoundError("Activity not found");
    }

    return this.getActivityById(activityId, userId) as Promise<ActivityDTO>;
  },

  /**
   * Deletes an owned activity entry.
   */
  async deleteActivity(activityId: string, userId: string): Promise<boolean> {
    if (
      !activityId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(activityId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new NotFoundError("Activity not found");
    }

    await connectDB();
    const result = await Activity.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(activityId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!result) {
      throw new NotFoundError("Activity not found");
    }

    return true;
  },

  /**
   * Helper for Task & Habit completion logging.
   */
  async logActivity(
    userId: string,
    data: {
      type: ActivityType;
      refId: string;
      sectionId?: string | null;
      title: string;
      occurredAt?: Date;
    }
  ): Promise<ActivityDTO> {
    await connectDB();

    const activity = await Activity.create({
      userId: new mongoose.Types.ObjectId(userId),
      type: data.type,
      refId: new mongoose.Types.ObjectId(data.refId),
      sectionId:
        data.sectionId && mongoose.Types.ObjectId.isValid(data.sectionId)
          ? new mongoose.Types.ObjectId(data.sectionId)
          : null,
      title: data.title,
      occurredAt: data.occurredAt || new Date(),
    });

    return toActivityDTO(activity);
  },

  /**
   * Helper for removing activities linked to tasks/habits when uncompleted or deleted.
   */
  async removeActivityByRef(
    userId: string,
    refId: string,
    type: ActivityType
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(refId)) {
      return;
    }

    await connectDB();
    await Activity.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
      refId: new mongoose.Types.ObjectId(refId),
      type,
    });
  },

  /**
   * Fast recent activities helper.
   */
  async getRecentActivities(
    userId: string,
    limit = 20
  ): Promise<ActivityDTO[]> {
    return this.getActivities(userId, { limit });
  },
};
