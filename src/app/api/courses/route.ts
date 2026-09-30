import { fail, ok } from "@/lib/api/response";
import { getCurrentUser, requireUser } from "@/lib/auth/helpers";
import { courseCreateSchema, listQuerySchema } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";
export async function GET(request: Request) { try { const url = new URL(request.url); const slug = url.searchParams.get("slug"); if (slug) return ok(await courseService.getBySlug(slug, await getCurrentUser())); const values = Object.fromEntries(url.searchParams); return ok(await courseService.list(listQuerySchema.parse(values))); } catch (error) { return fail(error); } }
export async function POST(request: Request) { try { return ok(await courseService.create(await requireUser(), courseCreateSchema.parse(await request.json())), 201); } catch (error) { return fail(error); } }
