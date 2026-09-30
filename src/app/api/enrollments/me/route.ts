import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";

export async function GET() {
  try {
    return ok(await enrollmentService.getForUser((await requireUser()).id));
  } catch (error) {
    return fail(error);
  }
}