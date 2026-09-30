import mongoose from "mongoose";
import { requireDatabaseEnv } from "@/lib/env";
const globalForMongo = global as typeof globalThis & { mongooseConnection?: Promise<typeof mongoose> };
export function connectToDatabase() { if (!globalForMongo.mongooseConnection) globalForMongo.mongooseConnection = mongoose.connect(requireDatabaseEnv()); return globalForMongo.mongooseConnection; }
