import mongoose, { Document, Model, Schema } from "mongoose";

export interface IHabitLogDocument extends Document {
  habitId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string; // Canonical format: YYYY-MM-DD
  completed: boolean;
  createdAt: Date;
}

const HabitLogSchema = new Schema<IHabitLogDocument>(
  {
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: [true, "Habit ID is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    date: {
      type: String,
      required: [true, "Date is required (YYYY-MM-DD)"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
      index: true,
    },
    completed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// CRITICAL UNIQUE COMPOUND INDEX: Guarantees idempotency — exactly one log per habit per date
HabitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });
HabitLogSchema.index({ userId: 1, date: 1 });
HabitLogSchema.index({ userId: 1, habitId: 1, date: 1 });

export const HabitLog: Model<IHabitLogDocument> =
  mongoose.models.HabitLog ||
  mongoose.model<IHabitLogDocument>("HabitLog", HabitLogSchema);

export default HabitLog;
