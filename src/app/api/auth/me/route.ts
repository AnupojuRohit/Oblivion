import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
export async function GET() { try { return ok(await requireUser()); } catch (error) { return fail(error); } }
