import mongoose, { Document, Model, Schema } from "mongoose";
import { HabitFrequency } from "@/types";

export interface IHabitDocument extends Document {
  userId: mongoose.Types.ObjectId;
  sectionId?: mongoose.Types.ObjectId | null;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetDays: number[];
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabitDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Habit title is required"],
      trim: true,
      minlength: [1, "Title must be at least 1 character"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly"],
      default: "daily",
      required: [true, "Frequency is required"],
    },
    targetDays: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6],
    },
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast user scoped queries
HabitSchema.index({ userId: 1, archived: 1 });
HabitSchema.index({ userId: 1, sectionId: 1 });

export const Habit: Model<IHabitDocument> =
  mongoose.models.Habit || mongoose.model<IHabitDocument>("Habit", HabitSchema);

export default Habit;
