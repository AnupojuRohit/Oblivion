import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { orderService } from "@/modules/orders/order.service";
export async function GET(){try{return ok(await orderService.listForUser(await requireUser()));}catch(error){return fail(error);}}