import mongoose, { Document, Model, Schema } from "mongoose";
import { ActivityType } from "@/types";

export interface IActivityDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: ActivityType;
  refId?: mongoose.Types.ObjectId | null;
  sectionId?: mongoose.Types.ObjectId | null;
  title: string;
  description?: string;
  duration?: number;
  tags: string[];
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivityDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    type: {
      type: String,
      enum: ["manual_entry", "task_completed", "habit_completed"],
      default: "manual_entry",
      required: [true, "Activity type is required"],
      index: true,
    },
    refId: {
      type: Schema.Types.ObjectId,
      default: null,
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
      required: [true, "Title is required"],
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
    duration: {
      type: Number,
      min: [0, "Duration cannot be negative"],
      max: [1440, "Duration cannot exceed 1440 minutes (24 hours)"],
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    occurredAt: {
      type: Date,
      required: [true, "Occurred date is required"],
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for timeline queries and filtering
ActivitySchema.index({ userId: 1, occurredAt: -1 });
ActivitySchema.index({ userId: 1, sectionId: 1 });
ActivitySchema.index({ userId: 1, tags: 1 });
ActivitySchema.index({ userId: 1, refId: 1, type: 1 });

export const Activity: Model<IActivityDocument> =
  mongoose.models.Activity ||
  mongoose.model<IActivityDocument>("Activity", ActivitySchema);

export default Activity;
