import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { resourceService } from "@/modules/resources/resource.service";
export async function GET(request: Request, { params }: { params: Promise<{ resourceId: string }> }) {
  try {
    const disposition = new URL(request.url).searchParams.get("inline") === "true" ? "inline" : "attachment";
    return ok(await resourceService.getDownloadUrl((await params).resourceId, await requireUser(), disposition));
  } catch (error) {
    return fail(error);
  }
}
