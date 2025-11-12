import mongoose from 'mongoose';

// Connection caching to avoid multiple connections in serverless environment
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connect to MongoDB with caching for serverless environments
 */
export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
      );
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Declaration Schema
const declarationSchema = new mongoose.Schema({
  owner: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
  },
  to: {
    type: String,
    required: true,
    lowercase: true,
  },
  value: {
    type: String,
    required: true,
  },
  payloadHash: {
    type: String,
    required: true,
  },
  signature: {
    type: String,
    required: true,
  },
  nonce: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  deadline: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "executed", "failed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  executedAt: {
    type: Date,
    default: null,
  },
  txHash: {
    type: String,
    default: null,
  },
});

// Create compound index for efficient queries
declarationSchema.index({ owner: 1, createdAt: -1 });

// TypeScript interface for type safety
export interface IDeclaration {
  _id?: string;
  owner: string;
  to: string;
  value: string;
  payloadHash: string;
  signature: string;
  nonce: string;
  deadline: number;
  status: "pending" | "executed" | "failed";
  createdAt: Date;
  executedAt?: Date | null;
  txHash?: string | null;
}

// Export model (with singleton pattern for serverless)
// Clear the model if it exists to ensure schema is up-to-date
if (mongoose.models.Declaration) {
  delete mongoose.models.Declaration;
}

export const Declaration = mongoose.model<IDeclaration>("Declaration", declarationSchema);
