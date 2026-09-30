import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { z } from "zod";
import { savedResourceService } from "@/modules/finder/saved-resource.service";
const schema = z.object({ videoId: z.string().min(1).max(32), title: z.string().min(1).max(300), channelName: z.string().min(1).max(200), thumbnailUrl: z.string().url().optional(), videoUrl: z.string().url(), topic: z.string().min(1).max(120) });
export async function GET() { try { return ok(await savedResourceService.list(await requireUser())); } catch (error) { return fail(error); } }
export async function POST(request: Request) { try { return ok(await savedResourceService.save(await requireUser(), schema.parse(await request.json())), 201); } catch (error) { return fail(error); } }
export async function DELETE(request: Request) { try { const videoId = new URL(request.url).searchParams.get("videoId"); if (!videoId) return fail(new Error("videoId is required")); await savedResourceService.remove(await requireUser(), videoId); return ok({ deleted: true }); } catch (error) { return fail(error); } }
