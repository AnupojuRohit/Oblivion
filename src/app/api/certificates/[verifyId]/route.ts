import { fail, ok } from "@/lib/api/response";
import { certificateService } from "@/modules/certificates/certificate.service";

export async function GET(_: Request, { params }: { params: Promise<{ verifyId: string }> }) {
  try {
    return ok(await certificateService.getPublicVerification((await params).verifyId));
  } catch (error) {
    return fail(error);
  }
}