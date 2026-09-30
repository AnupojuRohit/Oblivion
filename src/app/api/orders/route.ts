import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { createOrderSchema } from "@/modules/orders/order.schema";
import { orderService } from "@/modules/orders/order.service";

export async function POST(request: Request) {
  try {
    return ok(await orderService.createCourseOrder(await requireUser(), createOrderSchema.parse(await request.json())), 201);
  } catch (error) {
    return fail(error);
  }
}