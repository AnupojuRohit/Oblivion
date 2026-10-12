import { fail, ok } from "@/lib/api/response";
import { getCurrentUser, requireUser } from "@/lib/auth/helpers";
import { courseCreateSchema, listQuerySchema } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";

/**
 * GET /api/courses
 * Supports catalogue queries and an optional slug lookup.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    if (slug) {
      // Public course details still use the service's access rules.
      const user = await getCurrentUser();
      return ok(await courseService.getBySlug(slug, user));
    }

    const query = Object.fromEntries(url.searchParams);
    const validatedQuery = listQuerySchema.parse(query);

    return ok(await courseService.list(validatedQuery));
  } catch (error) {
    return fail(error);
  }
}

/**
 * POST /api/courses
 * Creates a draft. The service independently enforces instructor permissions.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const input = courseCreateSchema.parse(body);
    const course = await courseService.create(user, input);

    return ok(course, 201);
  } catch (error) {
    return fail(error);
  }
}
