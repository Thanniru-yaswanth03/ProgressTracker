import { z } from "zod";
import connectDB from "@/lib/db";
import { Section, ISectionDocument } from "@/models/Section";
import { Task } from "@/models/Task";
import { Habit } from "@/models/Habit";
import { Activity } from "@/models/Activity";
import { Goal } from "@/models/Goal";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { SectionDTO, CreateSectionInput, UpdateSectionInput } from "@/types";
import mongoose from "mongoose";

export const CreateSectionSchema = z.object({
  name: z
    .string()
    .min(1, "Section name is required")
    .max(50, "Section name cannot exceed 50 characters")
    .trim(),
  description: z
    .string()
    .max(200, "Description cannot exceed 200 characters")
    .optional()
    .default(""),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format")
    .optional()
    .default("#6366f1"),
});

export const UpdateSectionSchema = z.object({
  name: z
    .string()
    .min(1, "Section name is required")
    .max(50, "Section name cannot exceed 50 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(200, "Description cannot exceed 200 characters")
    .optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format")
    .optional(),
  order: z.number().int().min(0).optional(),
});

function toSectionDTO(doc: ISectionDocument): SectionDTO {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    description: doc.description || "",
    color: doc.color,
    order: doc.order,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const sectionService = {
  /**
   * Retrieves all sections for a user, ordered by custom order then creation time.
   */
  async getSections(userId: string): Promise<SectionDTO[]> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }

    await connectDB();
    const sections = await Section.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ order: 1, createdAt: 1 })
      .exec();

    return sections.map(toSectionDTO);
  },

  /**
   * Retrieves an owned section by ID. Returns null if not found or owned by another user.
   */
  async getSectionById(sectionId: string, userId: string): Promise<SectionDTO | null> {
    if (
      !sectionId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(sectionId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return null;
    }

    await connectDB();
    const section = await Section.findOne({
      _id: new mongoose.Types.ObjectId(sectionId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!section) return null;
    return toSectionDTO(section);
  },

  /**
   * Creates a new section scoped to the authenticated user.
   */
  async createSection(userId: string, input: CreateSectionInput): Promise<SectionDTO> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError("Invalid user ID");
    }

    const validated = CreateSectionSchema.parse(input);
    await connectDB();

    const count = await Section.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    });

    const section = await Section.create({
      userId: new mongoose.Types.ObjectId(userId),
      name: validated.name,
      description: validated.description,
      color: validated.color,
      order: count,
    });

    return toSectionDTO(section);
  },

  /**
   * Updates an owned section. Throws NotFoundError if section doesn't exist or isn't owned by user.
   */
  async updateSection(
    sectionId: string,
    userId: string,
    input: UpdateSectionInput
  ): Promise<SectionDTO> {
    if (
      !sectionId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(sectionId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new NotFoundError("Section not found");
    }

    const validated = UpdateSectionSchema.parse(input);
    await connectDB();

    const section = await Section.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(sectionId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: validated },
      { returnDocument: "after", runValidators: true }
    ).exec();

    if (!section) {
      throw new NotFoundError("Section not found");
    }

    return toSectionDTO(section);
  },

  /**
   * Deletes an owned section. Throws NotFoundError if section doesn't exist or isn't owned by user.
   */
  async deleteSection(sectionId: string, userId: string): Promise<boolean> {
    if (
      !sectionId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(sectionId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new NotFoundError("Section not found");
    }

    await connectDB();
    const result = await Section.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(sectionId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!result) {
      throw new NotFoundError("Section not found");
    }

    // Disassociate section from any owned tasks, habits, activities, and goals
    await Promise.all([
      Task.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), sectionId: new mongoose.Types.ObjectId(sectionId) },
        { $set: { sectionId: null } }
      ).exec(),
      Habit.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), sectionId: new mongoose.Types.ObjectId(sectionId) },
        { $set: { sectionId: null } }
      ).exec(),
      Activity.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), sectionId: new mongoose.Types.ObjectId(sectionId) },
        { $set: { sectionId: null } }
      ).exec(),
      Goal.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), sectionId: new mongoose.Types.ObjectId(sectionId) },
        { $set: { sectionId: null } }
      ).exec(),
    ]);

    return true;
  },
};
