import { fail, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/helpers";

export async function GET() {
  try {
    return ok(await getCurrentUser());
  } catch (error) {
    return fail(error);
  }
}
