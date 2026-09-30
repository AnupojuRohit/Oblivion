import { fail, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/helpers";
import { orderService } from "@/modules/orders/order.service";

export async function POST(_: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    return ok(await orderService.refundOrder(await requireAdmin(), (await params).orderId));
  } catch (error) {
    return fail(error);
  }
}