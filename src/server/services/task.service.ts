import { z } from "zod";
import connectDB from "@/lib/db";
import { Task, ITaskDocument } from "@/models/Task";
import { Section } from "@/models/Section";
import { activityService } from "@/server/services/activity.service";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  TaskDTO,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterOptions,
  SectionDTO,
} from "@/types";
import mongoose from "mongoose";

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(100, "Task title cannot exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),
  sectionId: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
  dueDate: z.string().nullable().optional(),
});

export const UpdateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(100, "Task title cannot exceed 100 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  sectionId: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(["pending", "completed"]).optional(),
});

function toTaskDTO(doc: ITaskDocument, sectionMap?: Map<string, SectionDTO>): TaskDTO {
  const sectionIdStr = doc.sectionId ? doc.sectionId.toString() : null;
  const section = sectionIdStr && sectionMap ? sectionMap.get(sectionIdStr) || null : null;

  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    sectionId: sectionIdStr,
    section,
    title: doc.title,
    description: doc.description || "",
    status: doc.status,
    priority: doc.priority,
    dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
    completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const taskService = {
  /**
   * Retrieves tasks for a user with optional filtering by status, section, priority, and search.
   */
  async getTasks(
    userId: string,
    filters?: TaskFilterOptions
  ): Promise<TaskDTO[]> {
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

    if (filters?.priority && filters.priority !== "all") {
      query.priority = filters.priority;
    }

    if (filters?.search && filters.search.trim()) {
      const searchRegex = new RegExp(filters.search.trim(), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const tasks = await Task.find(query)
      .sort({ status: 1, dueDate: 1, priority: -1, createdAt: -1 })
      .exec();

    // Fetch user sections to attach section details
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

    return tasks.map((t) => toTaskDTO(t, sectionMap));
  },

  /**
   * Retrieves a single owned task by ID.
   */
  async getTaskById(taskId: string, userId: string): Promise<TaskDTO | null> {
    if (
      !taskId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return null;
    }

    await connectDB();
    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!task) return null;

    let section: SectionDTO | null = null;
    if (task.sectionId) {
      const sec = await Section.findOne({
        _id: task.sectionId,
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
    return toTaskDTO(task, map);
  },

  /**
   * Creates a new task. Validates section ownership if sectionId is provided.
   */
  async createTask(userId: string, input: CreateTaskInput): Promise<TaskDTO> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    const validated = CreateTaskSchema.parse(input);
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

    const dueDate = validated.dueDate ? new Date(validated.dueDate) : null;

    const task = await Task.create({
      userId: new mongoose.Types.ObjectId(userId),
      sectionId: sectionObjectId,
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      dueDate,
      status: "pending",
    });

    const map = new Map<string, SectionDTO>();
    if (sectionInfo) map.set(sectionInfo.id, sectionInfo);
    return toTaskDTO(task, map);
  },

  /**
   * Updates an owned task. Validates section ownership if sectionId is changed.
   */
  async updateTask(
    taskId: string,
    userId: string,
    input: UpdateTaskInput
  ): Promise<TaskDTO> {
    if (
      !taskId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new NotFoundError("Task not found");
    }

    const validated = UpdateTaskSchema.parse(input);
    await connectDB();

    const existing = await Task.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!existing) {
      throw new NotFoundError("Task not found");
    }

    const updates: Record<string, unknown> = {};

    if (validated.title !== undefined) updates.title = validated.title;
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.priority !== undefined) updates.priority = validated.priority;
    if (validated.dueDate !== undefined) {
      updates.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
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

    if (validated.status !== undefined && validated.status !== existing.status) {
      updates.status = validated.status;
      if (validated.status === "completed") {
        updates.completedAt = new Date();
        await activityService.logActivity(userId, {
          type: "task_completed",
          refId: taskId,
          sectionId: (updates.sectionId || existing.sectionId)?.toString() || null,
          title: (updates.title as string) || existing.title,
        });
      } else {
        updates.completedAt = null;
        await activityService.removeActivityByRef(userId, taskId, "task_completed");
      }
    }

    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(taskId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    ).exec();

    if (!updatedTask) {
      throw new NotFoundError("Task not found");
    }

    return this.getTaskById(taskId, userId) as Promise<TaskDTO>;
  },

  /**
   * Toggles task completion state.
   */
  async toggleTaskStatus(
    taskId: string,
    userId: string,
    targetStatus?: "pending" | "completed"
  ): Promise<TaskDTO> {
    if (
      !taskId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new NotFoundError("Task not found");
    }

    await connectDB();
    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const nextStatus = targetStatus || (task.status === "completed" ? "pending" : "completed");

    return this.updateTask(taskId, userId, {
      status: nextStatus,
    });
  },

  /**
   * Deletes an owned task and cleans up its activity log.
   */
  async deleteTask(taskId: string, userId: string): Promise<boolean> {
    if (
      !taskId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new NotFoundError("Task not found");
    }

    await connectDB();
    const task = await Task.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(taskId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // Clean up activity log
    await activityService.removeActivityByRef(userId, taskId, "task_completed");

    return true;
  },
};
