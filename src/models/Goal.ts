import mongoose, { Document, Model, Schema } from "mongoose";
import { GoalStatus } from "@/types";

export interface IGoalDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sectionId?: mongoose.Types.ObjectId | null;
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

const GoalSchema = new Schema<IGoalDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Goal must belong to a user"],
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
      maxlength: [120, "Goal title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Goal description cannot exceed 500 characters"],
      default: "",
    },
    targetDate: {
      type: Date,
      default: null,
    },
    currentValue: {
      type: Number,
      default: 0,
      min: [0, "Current value cannot be negative"],
    },
    targetValue: {
      type: Number,
      default: 100,
      min: [1, "Target value must be at least 1"],
    },
    unit: {
      type: String,
      trim: true,
      maxlength: [20, "Unit cannot exceed 20 characters"],
      default: "%",
    },
    status: {
      type: String,
      enum: ["in_progress", "paused", "completed", "cancelled"],
      default: "in_progress",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for querying active goals and filtering efficiently
GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, sectionId: 1 });
GoalSchema.index({ userId: 1, createdAt: -1 });

export const Goal: Model<IGoalDocument> =
  mongoose.models.Goal || mongoose.model<IGoalDocument>("Goal", GoalSchema);
