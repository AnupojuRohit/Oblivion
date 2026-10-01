import mongoose from "mongoose";
import { requireDatabaseEnv } from "@/lib/env";

const globalForMongo = global as typeof globalThis & {
  mongooseConnection?: Promise<typeof mongoose>;
};

const MONGO_CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 8_000,
  maxPoolSize: 10,
} as const;

function createConnection() {
  return mongoose.connect(requireDatabaseEnv(), MONGO_CONNECT_OPTIONS).catch((error) => {
    globalForMongo.mongooseConnection = undefined;
    throw error;
  });
}

export function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }

  if (!globalForMongo.mongooseConnection) {
    globalForMongo.mongooseConnection = createConnection();
  }

  return globalForMongo.mongooseConnection;
}
