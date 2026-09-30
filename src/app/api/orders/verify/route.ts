import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { verifyOrderSchema } from "@/modules/orders/order.schema";
import { orderService } from "@/modules/orders/order.service";

export async function POST(request: Request) {
  try {
    return ok(await orderService.verifyPayment(await requireUser(), verifyOrderSchema.parse(await request.json())));
  } catch (error) {
    return fail(error);
  }
}