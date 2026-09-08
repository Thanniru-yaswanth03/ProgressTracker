import { Schema } from "mongoose";

/**
 * Global Data Protection Plugin for Mongoose.
 * 
 * Prevents catastrophic data loss by intercepting and rejecting any
 * deleteMany() or deleteOne() queries that lack a specific filter criteria.
 * Queries like Model.deleteMany({}) or Model.deleteMany() are blocked unconditionally.
 */
export function preventUnconditionalDeletePlugin(schema: Schema): void {
  schema.pre(["deleteMany", "deleteOne", "findOneAndDelete"], function () {
    const filter = this.getFilter();
    if (!filter || typeof filter !== "object" || Object.keys(filter).length === 0) {
      throw new Error(
        "FATAL DATA LOSS SAFEGUARD: An unconditional delete operation without filter criteria was blocked. Queries like Model.deleteMany({}) or Model.findOneAndDelete({}) are strictly prohibited."
      );
    }
  });
}
