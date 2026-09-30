import { fail, ok } from "@/lib/api/response";
import { orderService } from "@/modules/orders/order.service";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) throw new Error("Webhook signature is required");
    return ok(await orderService.handleWebhook(rawBody, signature));
  } catch (error) {
    return fail(error);
  }
}