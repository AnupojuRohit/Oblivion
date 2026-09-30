import { randomUUID } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Types } from "mongoose";
import { AppError } from "@/lib/errors/app-error";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import type { PublicUser } from "@/modules/auth/auth.types";
import { Course } from "@/modules/courses/course.model";
import { Enrollment } from "@/modules/enrollments/enrollment.model";
import { Certificate } from "./certificate.model";

type PublicCertificate = { id: string; verifyId: string; userId: string; courseId: string; courseSlugSnapshot?: string; studentNameSnapshot: string; courseTitleSnapshot: string; issuedAt: Date };

const toCertificateView = (certificate: { _id: { toString(): string }; verifyId: string; userId: { toString(): string }; courseId: { toString(): string }; courseSlugSnapshot: string; studentNameSnapshot: string; courseTitleSnapshot: string; issuedAt: Date }) => ({
  id: certificate._id.toString(),
  verifyId: certificate.verifyId,
  userId: certificate.userId.toString(),
  courseId: certificate.courseId.toString(),
  courseSlugSnapshot: certificate.courseSlugSnapshot,
  studentNameSnapshot: certificate.studentNameSnapshot,
  courseTitleSnapshot: certificate.courseTitleSnapshot,
  issuedAt: certificate.issuedAt,
});

export const certificateService = {
  async issueForCompletion(input: { user: PublicUser; courseId: string; courseTitleSnapshot: string }) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(input.courseId)) throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);

    const existing = await Certificate.findOne({ userId: input.user.id, courseId: input.courseId });
    if (existing) {
      if (!existing.courseSlugSnapshot) {
        const course = await Course.findById(input.courseId).select("slug").lean();
        if (!course) throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);
        await Certificate.updateOne({ _id: existing._id }, { $set: { courseSlugSnapshot: course.slug } });
      }
      return existing;
    }

    const course = await Course.findById(input.courseId).select("slug").lean();
    if (!course) throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);

    const certificate = await Certificate.create({
      verifyId: randomUUID().replace(/-/g, ""),
      userId: input.user.id,
      courseId: input.courseId,
      courseSlugSnapshot: course.slug,
      studentNameSnapshot: input.user.name,
      courseTitleSnapshot: input.courseTitleSnapshot,
      issuedAt: new Date(),
    });

    await Enrollment.updateOne({ userId: input.user.id, courseId: input.courseId }, { $set: { certificateId: certificate._id } });
    return certificate;
  },

  async ensureForUserCourse(user: PublicUser, courseId: string) {
    await connectToDatabase();
    const course = await Course.findById(courseId).select("title").lean();
    if (!course) throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);
    const enrollment = await Enrollment.findOne({ userId: user.id, courseId }).lean();
    if (!enrollment || enrollment.progressPercent < 100) throw new AppError("CERTIFICATE_NOT_FOUND", "Certificate not available yet", 404);
    const certificate = await certificateService.issueForCompletion({ user, courseId, courseTitleSnapshot: course.title });
    return certificate;
  },

  async getByVerifyId(verifyId: string) {
    await connectToDatabase();
    return Certificate.findOne({ verifyId }).lean();
  },

  async getByCourseAndUser(courseId: string, userId: string) {
    await connectToDatabase();
    return Certificate.findOne({ courseId, userId }).lean();
  },

  async getPublicVerification(verifyId: string) {
    const certificate = await this.getByVerifyId(verifyId);
    if (!certificate) throw new AppError("CERTIFICATE_NOT_FOUND", "Certificate not found", 404);
    return toCertificateView(certificate);
  },

  async buildPdf(certificateInput: PublicCertificate) {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([842, 595]);
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const width = page.getWidth();
    const height = page.getHeight();

    page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: rgb(0.31, 0.27, 0.85), borderWidth: 3, color: rgb(0.98, 0.99, 1) });
    page.drawText("LearnHub Certificate of Completion", { x: 70, y: 500, size: 28, font: fontBold, color: rgb(0.11, 0.13, 0.25) });
    page.drawText("This certifies that", { x: 70, y: 450, size: 18, font: fontRegular, color: rgb(0.26, 0.28, 0.38) });
    page.drawText(certificateInput.studentNameSnapshot, { x: 70, y: 405, size: 30, font: fontBold, color: rgb(0.31, 0.27, 0.85) });
    page.drawText("has successfully completed", { x: 70, y: 365, size: 18, font: fontRegular, color: rgb(0.26, 0.28, 0.38) });
    page.drawText(certificateInput.courseTitleSnapshot, { x: 70, y: 325, size: 24, font: fontBold, color: rgb(0.11, 0.13, 0.25) });
    page.drawText(`Issued on ${new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(certificateInput.issuedAt))}`, { x: 70, y: 250, size: 14, font: fontRegular, color: rgb(0.26, 0.28, 0.38) });
    page.drawText(`Verification ID: ${certificateInput.verifyId}`, { x: 70, y: 220, size: 14, font: fontRegular, color: rgb(0.26, 0.28, 0.38) });
    page.drawText(`Verify this certificate at /verify/${certificateInput.verifyId}`, { x: 70, y: 185, size: 12, font: fontRegular, color: rgb(0.45, 0.47, 0.54) });

    return pdf.save();
  },
};