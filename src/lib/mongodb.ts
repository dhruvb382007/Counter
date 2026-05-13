/**
 * MongoDB connection singleton.
 * Re-uses the connection across hot-reloads in development.
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in your .env.local file');
}

// Use a global cache to avoid creating new connections on every hot reload
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null;
}

let cached = global._mongooseConn;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached) return cached;

  const conn = await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  cached = conn;
  global._mongooseConn = conn;

  console.log('✅ MongoDB connected');
  return conn;
}
