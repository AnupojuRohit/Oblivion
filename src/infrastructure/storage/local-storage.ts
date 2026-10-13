import fs from "fs/promises";
import path from "path";
import type { SaveInput, StorageProvider } from "./storage.types";

const uploadsBaseDir = path.join(process.cwd(), "public", "uploads");

export const localStorage: StorageProvider = {
  async save({ key, body }: SaveInput) {
    const fullPath = path.join(uploadsBaseDir, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, Buffer.from(body));
  },

  async delete(key: string) {
    try {
      const fullPath = path.join(uploadsBaseDir, key);
      await fs.unlink(fullPath);
    } catch {
      // Ignore if file doesn't exist
    }
  },

  async getSignedUrl(key: string) {
    // Statically accessible under public/uploads
    const cleanKey = key.replace(/^\/+/, "");
    return `/uploads/${cleanKey}`;
  },

  async getSignedUploadUrl(key: string) {
    const cleanKey = key.replace(/^\/+/, "");
    return `/api/uploads/local?key=${encodeURIComponent(cleanKey)}`;
  },
};
