import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ requireRazorpayEnv: vi.fn(() => ({ keyId: "rzp_test_key", keySecret: "secret", webhookSecret: "webhook" })) }));
vi.mock("@/infrastructure/mongodb/connection", () => ({ connectToDatabase: vi.fn() }));
vi.mock("@/infrastructure/razorpay/razorpay.client", () => ({ createRazorpayOrder: vi.fn(), refundRazorpayPayment: vi.fn(), verifyRazorpayPaymentSignature: vi.fn(), verifyRazorpayWebhookSignature: vi.fn() }));
vi.mock("@/modules/courses/course.model", () => ({ Course: { findById: vi.fn(), findOne: vi.fn() } }));
vi.mock("@/modules/enrollments/enrollment.service", () => ({ enrollmentService: { hasEnrollment: vi.fn(), createEnrollment: vi.fn(), removeEnrollment: vi.fn() } }));
vi.mock("./order.model", () => ({ Order: { create: vi.fn(), findOne: vi.fn(), findById: vi.fn() } }));
vi.mock("./payment-event.model", () => ({ PaymentEvent: { findOne: vi.fn(), create: vi.fn(), updateOne: vi.fn() } }));

import { createRazorpayOrder, refundRazorpayPayment, verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from "@/infrastructure/razorpay/razorpay.client";
import { Course } from "@/modules/courses/course.model";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";
import { Order } from "./order.model";
import { PaymentEvent } from "./payment-event.model";
import { orderService } from "./order.service";

const courseMock = vi.mocked(Course);
const orderMock = vi.mocked(Order);
const paymentEventMock = vi.mocked(PaymentEvent);
const enrollmentMock = vi.mocked(enrollmentService);
const razorpayCreateMock = vi.mocked(createRazorpayOrder);
const refundMock = vi.mocked(refundRazorpayPayment);
const verifySignatureMock = vi.mocked(verifyRazorpayPaymentSignature);
const verifyWebhookSignatureMock = vi.mocked(verifyRazorpayWebhookSignature);

const course = { _id: { toString: () => "507f1f77bcf86cd799439011" }, instructorId: { toString: () => "507f1f77bcf86cd799439012" }, title: "Docker for Developers", status: "PUBLISHED", price: 499, currency: "INR" };

beforeEach(() => {
  vi.clearAllMocks();
  enrollmentMock.hasEnrollment.mockResolvedValue(false as never);
  enrollmentMock.createEnrollment.mockResolvedValue({ enrollment: { _id: { toString: () => "enrollment-1" } }, created: true } as never);
  enrollmentMock.removeEnrollment.mockResolvedValue(true as never);
  courseMock.findById.mockResolvedValue(course as never);
  courseMock.findOne.mockResolvedValue(course as never);
  orderMock.create.mockResolvedValue({ _id: { toString: () => "507f1f77bcf86cd799439013" }, userId: { toString: () => "507f1f77bcf86cd799439014" }, courseId: { toString: () => "507f1f77bcf86cd799439011" }, instructorId: { toString: () => "507f1f77bcf86cd799439012" }, courseTitleSnapshot: course.title, priceSnapshot: 499, currencySnapshot: "INR", amount: 49900, status: "CREATED", razorpayOrderId: undefined, razorpayPaymentId: undefined, createdAt: new Date(), paidAt: undefined, refundedAt: undefined, save: vi.fn() } as never);
  orderMock.findOne.mockResolvedValue({ _id: { toString: () => "507f1f77bcf86cd799439013" }, userId: { toString: () => "507f1f77bcf86cd799439014" }, courseId: { toString: () => "507f1f77bcf86cd799439011" }, instructorId: { toString: () => "507f1f77bcf86cd799439012" }, courseTitleSnapshot: course.title, priceSnapshot: 499, currencySnapshot: "INR", amount: 49900, status: "CREATED", razorpayOrderId: "order_razorpay_1", razorpayPaymentId: undefined, razorpaySignature: undefined, createdAt: new Date(), paidAt: undefined, refundedAt: undefined, save: vi.fn() } as never);
  orderMock.findById.mockResolvedValue({ _id: { toString: () => "507f1f77bcf86cd799439013" }, userId: { toString: () => "507f1f77bcf86cd799439014" }, courseId: { toString: () => "507f1f77bcf86cd799439011" }, instructorId: { toString: () => "507f1f77bcf86cd799439012" }, courseTitleSnapshot: course.title, priceSnapshot: 499, currencySnapshot: "INR", amount: 49900, status: "PAID", razorpayOrderId: "order_razorpay_1", razorpayPaymentId: "payment_1", razorpaySignature: undefined, createdAt: new Date(), paidAt: new Date(), refundedAt: undefined, save: vi.fn() } as never);
  paymentEventMock.findOne.mockResolvedValue(null as never);
  paymentEventMock.create.mockResolvedValue(undefined as never);
  paymentEventMock.updateOne.mockResolvedValue(undefined as never);
  razorpayCreateMock.mockResolvedValue({ id: "order_razorpay_1", amount: 49900, currency: "INR", status: "created" } as never);
  refundMock.mockResolvedValue({ id: "refund_1", amount: 49900, status: "processed" } as never);
  verifySignatureMock.mockReturnValue(true);
  verifyWebhookSignatureMock.mockReturnValue(true);
});

describe("orderService", () => {
  it("creates a checkout order using the server-side course price", async () => {
    const result = await orderService.createCourseOrder({ id: "507f1f77bcf86cd799439014", name: "Student", email: "student@example.com", role: "STUDENT" }, { courseId: "507f1f77bcf86cd799439011" });

    expect(razorpayCreateMock).toHaveBeenCalledWith(expect.objectContaining({ amount: 49900, currency: "INR", receipt: "507f1f77bcf86cd799439013", notes: expect.objectContaining({ orderId: "507f1f77bcf86cd799439013", courseId: "507f1f77bcf86cd799439011", userId: "507f1f77bcf86cd799439014" }) }));
    expect(result.checkout.orderId).toBe("order_razorpay_1");
    expect(result.order.amount).toBe(49900);
  });

  it("rejects payment verification with an invalid signature", async () => {
    verifySignatureMock.mockReturnValue(false);

    await expect(orderService.verifyPayment({ id: "507f1f77bcf86cd799439014", name: "Student", email: "student@example.com", role: "STUDENT" }, { razorpayOrderId: "order_razorpay_1", razorpayPaymentId: "payment_1", razorpaySignature: "bad" })).rejects.toMatchObject({ code: "PAYMENT_SIGNATURE_INVALID" });
  });

  it("processes a webhook and creates an enrollment", async () => {
    const payload = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "payment_1", order_id: "order_razorpay_1" } } } });

    const result = await orderService.handleWebhook(payload, "valid-signature");

    expect(result).toEqual({ processed: true });
    expect(enrollmentMock.createEnrollment).toHaveBeenCalledWith({ userId: "507f1f77bcf86cd799439014", courseId: "507f1f77bcf86cd799439011", orderId: "507f1f77bcf86cd799439013" });
    expect(paymentEventMock.updateOne).toHaveBeenCalledWith({ provider: "razorpay", eventId: "payment_1" }, { $set: { processed: true } });
  });

  it("refunds a paid order and revokes the enrollment", async () => {
    const result = await orderService.refundOrder({ id: "507f1f77bcf86cd799439015", name: "Admin", email: "admin@example.com", role: "ADMIN" }, "507f1f77bcf86cd799439013");

    expect(refundMock).toHaveBeenCalledWith({ paymentId: "payment_1", amount: 49900 });
    expect(enrollmentMock.removeEnrollment).toHaveBeenCalledWith("507f1f77bcf86cd799439014", "507f1f77bcf86cd799439011");
    expect(result.revoked).toBe(true);
  });
});