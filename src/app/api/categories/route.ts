import { fail, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/helpers";
import { categorySchema } from "@/modules/categories/category.schema";
import { categoryService } from "@/modules/categories/category.service";
export async function GET() { try { return ok(await categoryService.list()); } catch (error) { return fail(error); } }
export async function POST(request: Request) { try { await requireAdmin(); return ok(await categoryService.create(categorySchema.parse(await request.json())), 201); } catch (error) { return fail(error); } }
