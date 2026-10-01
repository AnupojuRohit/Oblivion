import Link from "next/link";
import { requireUser } from "@/lib/auth/helpers";
import { orderService } from "@/modules/orders/order.service";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await orderService.listForUser(user);
  return (
    <section className="p-6 md:p-10">
      <p className="font-semibold text-indigo-600">PAYMENTS</p>
      <h1 className="mt-2 text-3xl font-bold">Orders</h1>
      <p className="mt-1 text-[var(--muted)]">Your payment and enrollment history.</p>
      <div className="mt-8 overflow-hidden rounded-xl border bg-[var(--surface)]">
        {orders.length ? orders.map((order) => (
          <div key={order.id} className="grid gap-3 border-b p-5 last:border-0 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div><p className="font-semibold">{order.courseTitleSnapshot}</p><p className="mt-1 text-xs text-[var(--muted)]">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(order.createdAt))} · {order.razorpayOrderId ?? "Order created"}</p></div>
            <div className="text-sm font-semibold">{new Intl.NumberFormat("en-IN", { style: "currency", currency: order.currencySnapshot }).format(order.priceSnapshot)}</div>
            <div className="flex items-center gap-2"><span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold">{order.status}</span>{order.status === "PAID" ? <Link href={`/learn/${order.courseId}`} className="text-sm font-semibold text-indigo-600">Open course</Link> : null}</div>
          </div>
        )) : <div className="p-6"><p className="font-semibold">No orders yet</p><p className="mt-2 text-sm text-[var(--muted)]">Paid course purchases will appear here after checkout.</p><Link href="/courses" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Browse courses</Link></div>}
      </div>
    </section>
  );
}
