import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISectionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  color: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISectionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Section name is required"],
      trim: true,
      minlength: [1, "Name must be at least 1 character"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
      default: "",
    },
    color: {
      type: String,
      trim: true,
      default: "#6366f1", // Indigo
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast scoped sorting and unique naming within user scope
SectionSchema.index({ userId: 1, order: 1 });
SectionSchema.index({ userId: 1, name: 1 });

export const Section: Model<ISectionDocument> =
  mongoose.models.Section ||
  mongoose.model<ISectionDocument>("Section", SectionSchema);

export default Section;
