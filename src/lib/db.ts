import mongoose from "mongoose";
import { preventUnconditionalDeletePlugin } from "./mongooseSafetyPlugin";

// Register safeguard against unconditional deletes globally for all Mongoose models
mongoose.plugin(preventUnconditionalDeletePlugin);

function getResolvedMongoUri(): string {
  const isScriptOrTest =
    process.env.NODE_ENV === "test" ||
    process.env.IS_TEST_RUN === "true" ||
    (Array.isArray(process.argv) &&
      process.argv.some(
        (arg) =>
          arg.includes("scripts") ||
          arg.includes("verify") ||
          arg.includes("test") ||
          arg.includes("audit")
      ) &&
      process.env.FORCE_PROD_DB !== "true");

  // If running in test or script execution mode, isolate completely to a test database
  if (isScriptOrTest) {
    if (process.env.TEST_MONGODB_URI) {
      return process.env.TEST_MONGODB_URI;
    }
    const base = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/progress_tracker";
    if (base.includes("/progress_tracker")) {
      return base.replace("/progress_tracker", "/progress_tracker_test");
    }
    return `${base}_test`;
  }

  const uri =
    process.env.MONGODB_URI ||
    (process.env.NODE_ENV !== "production"
      ? "mongodb://127.0.0.1:27017/progress_tracker"
      : undefined);

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
    };

    const uri = getResolvedMongoUri();
    cached!.promise = mongoose.connect(uri, opts).then((m) => {
      return m;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;
