import { AppError } from "@/lib/errors/app-error";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import { Category } from "./category.model";
const defaultCategories = [
  { name: "Software Development", slug: "software-development", description: "Programming, web development, and systems engineering" },
  { name: "Artificial Intelligence", slug: "artificial-intelligence", description: "Machine learning, LLMs, and AI tools" },
  { name: "Design & UX", slug: "design-ux", description: "User interface, product design, and creative direction" },
  { name: "Cloud & DevOps", slug: "cloud-devops", description: "Infrastructure, Docker, Kubernetes, and cloud platforms" },
  { name: "General Skills", slug: "general-skills", description: "Foundational and interdisciplinary skills" },
];

export const categoryService = {
  async list() {
    await connectToDatabase();
    let categories = await Category.find().sort({ name: 1 }).lean();
    if (categories.length === 0) {
      try {
        await Category.insertMany(defaultCategories, { ordered: false });
        categories = await Category.find().sort({ name: 1 }).lean();
      } catch {
        // Ignore duplicate key errors if inserted concurrently
      }
    }
    return categories;
  },
  async create(input: { name: string; slug: string; description?: string }) {
    await connectToDatabase();
    if (await Category.exists({ slug: input.slug })) {
      throw new AppError("CATEGORY_ALREADY_EXISTS", "A category with this slug already exists", 409);
    }
    return Category.create(input);
  },
  async exists(id: string) {
    await connectToDatabase();
    return Boolean(await Category.exists({ _id: id }));
  },
};
