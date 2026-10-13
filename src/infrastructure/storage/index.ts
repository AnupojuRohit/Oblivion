import { env } from "@/lib/env";
import { s3Storage } from "./s3-storage";
import { localStorage } from "./local-storage";
import type { StorageProvider } from "./storage.types";

const isS3Configured = Boolean(
  env.STORAGE_ENDPOINT &&
    env.STORAGE_ACCESS_KEY &&
    env.STORAGE_SECRET_KEY &&
    env.STORAGE_BUCKET
);

export const storage: StorageProvider = isS3Configured ? s3Storage : localStorage;
export type { StorageProvider } from "./storage.types";
