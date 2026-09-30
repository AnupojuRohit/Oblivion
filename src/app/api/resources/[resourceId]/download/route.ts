import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { resourceService } from "@/modules/resources/resource.service";
export async function GET(_: Request, { params }: { params: Promise<{ resourceId: string }> }) { try { return ok(await resourceService.getDownloadUrl((await params).resourceId, await requireUser())); } catch (error) { return fail(error); } }
