import { Types } from "mongoose";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import {
  createRazorpayOrder,
  refundRazorpayPayment,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "@/infrastructure/razorpay/razorpay.client";
import { requireRazorpayEnv } from "@/lib/env";
import { AppError } from "@/lib/errors/app-error";
import type { PublicUser } from "@/modules/auth/auth.types";
import { Course } from "@/modules/courses/course.model";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";
import { Order } from "./order.model";
import { PaymentEvent } from "./payment-event.model";

/**
 * Return only the fields the application intentionally exposes to clients.
 * Keeping this mapping explicit prevents internal persistence fields from
 * accidentally becoming part of the API contract.
 */
function toPublicOrder(order: any) {
  return {
    id: order._id.toString(),
    userId: order.userId.toString(),
    courseId: order.courseId.toString(),
    instructorId: order.instructorId.toString(),
    courseTitleSnapshot: order.courseTitleSnapshot,
    priceSnapshot: order.priceSnapshot,
    currencySnapshot: order.currencySnapshot,
    amount: order.amount,
    status: order.status,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    refundedAt: order.refundedAt,
  };
}

async function findPublishedCourse(courseId: string) {
  if (!Types.ObjectId.isValid(courseId)) {
    throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);
  }

  const course = await Course.findById(courseId);
  if (!course || course.status !== "PUBLISHED") {
    throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);
  }

  return course;
}

function createCheckoutDetails(
  order: any,
  user: PublicUser,
  courseTitle: string,
) {
  return {
    keyId: requireRazorpayEnv().keyId,
    orderId: order.razorpayOrderId,
    amount: order.amount,
    currency: order.currencySnapshot,
    name: "Oblivion",
    description: `Enroll in ${courseTitle}`,
    prefill: { name: user.name, email: user.email },
  };
}

function resolveWebhookEventId(payload: any, eventType: string) {
  return (
    payload?.payload?.payment?.entity?.id ??
    payload?.payload?.order?.entity?.id ??
    payload?.payload?.payment_link?.entity?.id ??
    `${eventType}:${payload?.created_at ?? Date.now()}`
  );
}

export const orderService = {
  async listForUser(user: PublicUser) {
    await connectToDatabase();

    const orders = await Order.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    return orders.map(toPublicOrder);
  },

  async createCourseOrder(user: PublicUser, input: { courseId: string }) {
    await connectToDatabase();

    const course = await findPublishedCourse(input.courseId);

    if (course.instructorId.toString() === user.id) {
      throw new AppError(
        "FORBIDDEN",
        "Instructors cannot purchase their own course",
        403,
      );
    }

    if (await enrollmentService.hasEnrollment(user.id, course._id.toString())) {
      throw new AppError(
        "ALREADY_ENROLLED",
        "You are already enrolled in this course",
        409,
      );
    }

    if (course.price === 0) {
      throw new AppError(
        "FREE_COURSE_ENROLLMENT_REQUIRED",
        "Free courses must be enrolled directly",
        400,
      );
    }

    if (course.currency !== "INR") {
      throw new AppError(
        "UNSUPPORTED_CURRENCY",
        "Only INR courses are currently supported for Razorpay checkout",
        400,
      );
    }

    // Reuse an existing open checkout to avoid creating needless duplicate orders.
    const existingOrder = await Order.findOne({
      userId: user.id,
      courseId: course._id,
      status: "CREATED",
      razorpayOrderId: { $exists: true },
    });

    if (existingOrder) {
      return {
        order: toPublicOrder(existingOrder),
        checkout: createCheckoutDetails(existingOrder, user, course.title),
      };
    }

    // The amount comes from the stored course, never from client-supplied price.
    const order = await Order.create({
      userId: user.id,
      courseId: course._id.toString(),
      instructorId: course.instructorId.toString(),
      courseTitleSnapshot: course.title,
      priceSnapshot: course.price,
      currencySnapshot: course.currency,
      amount: course.price * 100,
      status: "CREATED",
    });

    const razorpayOrder = await createRazorpayOrder({
      amount: order.amount,
      currency: order.currencySnapshot,
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        courseId: course._id.toString(),
        userId: user.id,
      },
    });

    order.razorpayOrderId = razorpayOrder.id;
    order.amount = razorpayOrder.amount;
    await order.save();

    return {
      order: toPublicOrder(order),
      checkout: createCheckoutDetails(order, user, course.title),
    };
  },

  async verifyPayment(
    user: PublicUser,
    input: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ) {
    await connectToDatabase();

    const order = await Order.findOne({
      razorpayOrderId: input.razorpayOrderId,
    });

    if (!order) {
      throw new AppError("ORDER_NOT_FOUND", "Order not found", 404);
    }

    if (order.userId.toString() !== user.id && user.role !== "ADMIN") {
      throw new AppError(
        "FORBIDDEN",
        "You can only verify your own payment",
        403,
      );
    }

    // Never trust a browser success callback without verifying the signature.
    const signatureIsValid = verifyRazorpayPaymentSignature({
      orderId: input.razorpayOrderId,
      paymentId: input.razorpayPaymentId,
      signature: input.razorpaySignature,
    });

    if (!signatureIsValid) {
      throw new AppError(
        "PAYMENT_SIGNATURE_INVALID",
        "Payment signature is invalid",
        400,
      );
    }

    if (order.status === "REFUNDED") {
      throw new AppError(
        "ORDER_ALREADY_REFUNDED",
        "This order has already been refunded",
        409,
      );
    }

    if (
      order.status === "PAID" &&
      order.razorpayPaymentId &&
      order.razorpayPaymentId !== input.razorpayPaymentId
    ) {
      throw new AppError(
        "ORDER_ALREADY_PAID",
        "This order is already associated with a different payment",
        409,
      );
    }

    if (order.status !== "PAID") {
      order.status = "PAID";
      order.razorpayPaymentId = input.razorpayPaymentId;
      order.razorpaySignature = input.razorpaySignature;
      order.paidAt = new Date();
      await order.save();
    }

    // Enrollment creation must follow verified payment, not checkout initiation.
    const enrollment = await enrollmentService.createEnrollment({
      userId: order.userId.toString(),
      courseId: order.courseId.toString(),
      orderId: order._id.toString(),
    });

    return {
      order: toPublicOrder(order),
      enrollment: enrollment.enrollment,
    };
  },

  async handleWebhook(rawBody: string, signature: string) {
    await connectToDatabase();

    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      throw new AppError(
        "PAYMENT_SIGNATURE_INVALID",
        "Webhook signature is invalid",
        400,
      );
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event ?? "unknown";

    // Ignore events that do not represent a completed payment.
    if (!["payment.captured", "order.paid"].includes(eventType)) {
      return { ignored: true, event: eventType };
    }

    const razorpayOrderId =
      payload.payload?.payment?.entity?.order_id ??
      payload.payload?.order?.entity?.id;
    const razorpayPaymentId =
      payload.payload?.payment?.entity?.id ??
      payload.payload?.payment_link?.entity?.payment_id;
    const eventId = resolveWebhookEventId(payload, eventType);

    // Providers may retry webhooks. The event record makes processing repeatable.
    const existingEvent = await PaymentEvent.findOne({
      provider: "razorpay",
      eventId,
    });

    if (existingEvent?.processed) return { duplicate: true };

    if (!existingEvent) {
      try {
        const relatedOrder = razorpayOrderId
          ? await Order.findOne({ razorpayOrderId })
          : null;

        await PaymentEvent.create({
          provider: "razorpay",
          eventId,
          eventType,
          orderId: relatedOrder?._id,
          payload,
          processed: false,
        });
      } catch (error) {
        // A concurrent webhook may have inserted the same unique event first.
        const isDuplicateKey =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code?: number }).code === 11000;

        if (!isDuplicateKey) throw error;
      }
    }

    if (razorpayOrderId) {
      const order = await Order.findOne({ razorpayOrderId });

      if (order && order.status !== "PAID") {
        order.status = "PAID";
        if (razorpayPaymentId) {
          order.razorpayPaymentId = razorpayPaymentId;
        }
        order.paidAt = order.paidAt ?? new Date();
        await order.save();

        await enrollmentService.createEnrollment({
          userId: order.userId.toString(),
          courseId: order.courseId.toString(),
          orderId: order._id.toString(),
        });
      }
    }

    await PaymentEvent.updateOne(
      { provider: "razorpay", eventId },
      { $set: { processed: true } },
    );

    return { processed: true };
  },

  async refundOrder(user: PublicUser, orderId: string) {
    await connectToDatabase();

    if (user.role !== "ADMIN") {
      throw new AppError("FORBIDDEN", "Admin access is required", 403);
    }

    if (!Types.ObjectId.isValid(orderId)) {
      throw new AppError("ORDER_NOT_FOUND", "Order not found", 404);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError("ORDER_NOT_FOUND", "Order not found", 404);
    }

    if (order.status === "REFUNDED") {
      return { order: toPublicOrder(order), revoked: false };
    }

    if (order.status !== "PAID" || !order.razorpayPaymentId) {
      throw new AppError(
        "PAYMENT_FAILED",
        "Only paid orders can be refunded",
        400,
      );
    }

    await refundRazorpayPayment({
      paymentId: order.razorpayPaymentId,
      amount: order.amount,
    });

    order.status = "REFUNDED";
    order.refundedAt = new Date();
    await order.save();

    await enrollmentService.removeEnrollment(
      order.userId.toString(),
      order.courseId.toString(),
    );

    return { order: toPublicOrder(order), revoked: true };
  },
};
