import { fail, ok } from "@/lib/api/response";
import { getCurrentUser, requireUser } from "@/lib/auth/helpers";
import { reviewInputSchema } from "@/modules/reviews/review.schema";
import { reviewService } from "@/modules/reviews/review.service";

export async function GET(_: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    return ok(await reviewService.listForCourse((await params).courseId));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    return ok(await reviewService.create(await requireUser(), (await params).courseId, reviewInputSchema.parse(await request.json())), 201);
  } catch (error) {
    return fail(error);
  }
}