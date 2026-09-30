import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { AppError } from "@/lib/errors/app-error";
import { certificateService } from "@/modules/certificates/certificate.service";

export async function GET(_: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTH_REQUIRED", "Please sign in to continue", 401);
    const certificate = await certificateService.ensureForUserCourse(user, (await params).courseId);
    const pdf = await certificateService.buildPdf(await certificateService.getPublicVerification(certificate.verifyId));
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="learnhub-certificate-${certificate.verifyId}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof AppError ? { code: error.code, message: error.message } : { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }, { status: error instanceof AppError ? error.status : 500 });
  }
}