import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { resourceService } from "@/modules/resources/resource.service";
export async function DELETE(_: Request, { params }: { params: Promise<{ resourceId: string }> }) { try { await resourceService.remove((await params).resourceId, await requireUser()); return ok({ deleted: true }); } catch (error) { return fail(error); } }
