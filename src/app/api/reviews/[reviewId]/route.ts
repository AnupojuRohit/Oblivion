import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { reviewUpdateSchema } from "@/modules/reviews/review.schema";
import { reviewService } from "@/modules/reviews/review.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  try {
    return ok(await reviewService.update(await requireUser(), (await params).reviewId, reviewUpdateSchema.parse(await request.json())));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  try {
    await reviewService.remove(await requireUser(), (await params).reviewId);
    return ok({ deleted: true });
  } catch (error) {
    return fail(error);
  }
}