import { AppError } from "@/lib/errors/app-error";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import { Category } from "./category.model";
export const categoryService = { async list() { await connectToDatabase(); return Category.find().sort({ name: 1 }).lean(); }, async create(input: { name: string; slug: string; description?: string }) { await connectToDatabase(); if (await Category.exists({ slug: input.slug })) throw new AppError("CATEGORY_ALREADY_EXISTS", "A category with this slug already exists", 409); return Category.create(input); }, async exists(id: string) { await connectToDatabase(); return Boolean(await Category.exists({ _id: id })); } };
