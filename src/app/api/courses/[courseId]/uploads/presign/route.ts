import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit/memory-rate-limit";
import { presignUploadSchema } from "@/modules/resources/resource.schema";
import { resourceService } from "@/modules/resources/resource.service";
export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) { try { enforceRateLimit(`upload:${getRequestIp(request.headers)}`, 20); return ok(await resourceService.createUploadIntent((await params).courseId, await requireUser(), presignUploadSchema.parse(await request.json()))); } catch (error) { return fail(error); } }
