import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { registerResourceSchema } from "@/modules/resources/resource.schema";
import { resourceService } from "@/modules/resources/resource.service";
export async function GET(_: Request, { params }: { params: Promise<{ courseId: string }> }) { try { return ok(await resourceService.listForCourse((await params).courseId, await requireUser())); } catch (error) { return fail(error); } }
export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) { try { return ok(await resourceService.register((await params).courseId, await requireUser(), registerResourceSchema.parse(await request.json())), 201); } catch (error) { return fail(error); } }
