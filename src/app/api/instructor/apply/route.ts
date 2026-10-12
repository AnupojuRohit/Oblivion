import { z } from "zod";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import { fail, ok } from "@/lib/api/response";
import { AppError } from "@/lib/errors/app-error";
import { requireUser } from "@/lib/auth/helpers";
import { InstructorApplication } from "@/modules/instructor/instructor-application.model";

const applicationSchema = z.object({
  bio: z.string().trim().min(30).max(2000),
  expertise: z.string().trim().min(2).max(500),
});

/**
 * GET /api/instructor/apply
 * Returns the signed-in user's application, if one exists.
 */
export async function GET() {
  try {
    const user = await requireUser();
    await connectToDatabase();

    const application = await InstructorApplication.findOne({
      userId: user.id,
    }).lean();

    return ok(application);
  } catch (error) {
    return fail(error);
  }
}

/**
 * POST /api/instructor/apply
 * Submits or resubmits an application. Instructor access is still granted
 * through the separate administrator review flow, not by this endpoint.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();

    if (user.role !== "STUDENT") {
      throw new AppError(
        "FORBIDDEN",
        "Only student accounts can apply to become instructors",
        403,
      );
    }

    const input = applicationSchema.parse(await request.json());
    await connectToDatabase();

    const existingApplication = await InstructorApplication.findOne({
      userId: user.id,
    });

    if (existingApplication?.status === "PENDING") {
      throw new AppError(
        "APPLICATION_PENDING",
        "You already have a pending instructor application",
        409,
      );
    }

    const application = await InstructorApplication.findOneAndUpdate(
      { userId: user.id },
      {
        $set: {
          ...input,
          status: "PENDING",
          reviewedAt: null,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return ok(application, 201);
  } catch (error) {
    return fail(error);
  }
}
