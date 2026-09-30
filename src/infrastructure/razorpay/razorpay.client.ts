import crypto from "node:crypto";
import { requireRazorpayEnv } from "@/lib/env";

type RazorpayOrderInput = { amount: number; currency: string; receipt: string; notes?: Record<string, string> };
type RazorpayRefundInput = { paymentId: string; amount: number; speed?: "normal" | "optimum" };

const authHeader = () => {
  const { keyId, keySecret } = requireRazorpayEnv();
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
};

const requestJson = async <T>(url: string, init: RequestInit) => {
  const response = await fetch(url, { ...init, headers: { Authorization: authHeader(), "Content-Type": "application/json", ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error(`Razorpay request failed with status ${response.status}`);
  return response.json() as Promise<T>;
};

export async function createRazorpayOrder(input: RazorpayOrderInput) {
  return requestJson<{ id: string; amount: number; currency: string; status: string; receipt?: string; notes?: Record<string, string> }>("https://api.razorpay.com/v1/orders", { method: "POST", body: JSON.stringify({ amount: input.amount, currency: input.currency, receipt: input.receipt, notes: input.notes ?? {} }) });
}

export async function refundRazorpayPayment(input: RazorpayRefundInput) {
  return requestJson<{ id: string; amount: number; status: string }>(`https://api.razorpay.com/v1/payments/${input.paymentId}/refund`, { method: "POST", body: JSON.stringify({ amount: input.amount, speed: input.speed ?? "normal" }) });
}

export function verifyRazorpayPaymentSignature(input: { orderId: string; paymentId: string; signature: string }) {
  const { keySecret } = requireRazorpayEnv();
  const expected = crypto.createHmac("sha256", keySecret).update(`${input.orderId}|${input.paymentId}`).digest("hex");
  return expected.length === input.signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature));
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string) {
  const { webhookSecret } = requireRazorpayEnv();
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}