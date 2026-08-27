import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { toOrderDto } from "@/lib/orders";
import {
  confirmTossPayment,
  mapTossMethodToPaymentMethod,
  toTossOrderId,
} from "@/lib/toss";
import { notify } from "@/lib/notify";
import { earnPointsForOrder } from "@/lib/points";
import { finalizeDiscountsOnPaid } from "@/lib/order-discounts";
import { assertApiRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertApiRateLimit(request, "toss-confirm", 30, 15 * 60 * 1000);
    const user = await requireUser();
    const body = (await request.json()) as {
      paymentKey?: string;
      orderId?: string;
      amount?: number;
    };

    const paymentKey = body.paymentKey?.trim();
    const tossOrderId = body.orderId?.trim();
    const amount = Number(body.amount);

    if (!paymentKey || !tossOrderId || !Number.isFinite(amount)) {
      return jsonError("결제 정보가 올바르지 않습니다.", 400);
    }

    const paymentId = tossOrderId.startsWith("pay_")
      ? tossOrderId.slice(4)
      : tossOrderId;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            product: {
              select: { id: true, name: true, slug: true, saleType: true },
            },
            items: true,
          },
        },
      },
    });

    if (!payment || toTossOrderId(payment.id) !== tossOrderId) {
      return jsonError("결제 세션을 찾을 수 없습니다.", 404);
    }

    const order = payment.order;
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return jsonError("접근 권한이 없습니다.", 403);
    }

    if (payment.amount !== amount || order.totalPrice !== amount) {
      return jsonError("결제 금액이 주문 금액과 다릅니다.", 400);
    }

    if (order.paymentStatus === "PAID" && payment.status === "PAID") {
      return NextResponse.json({ order: toOrderDto(order), alreadyPaid: true });
    }

    const confirmed = await confirmTossPayment({
      paymentKey,
      orderId: tossOrderId,
      amount,
    });

    const method = mapTossMethodToPaymentMethod(confirmed.method);
    const paidAt = confirmed.approvedAt
      ? new Date(confirmed.approvedAt)
      : new Date();

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          method,
          transactionId: confirmed.paymentKey,
          paidAt,
        },
      });

      return tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          paymentMethod: method,
          paidAt,
          status:
            order.status === "PENDING" || order.status === "AWAITING_PAYMENT"
              ? "CONFIRMED"
              : order.status,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: {
            select: { id: true, name: true, slug: true, saleType: true },
          },
          items: true,
        },
      });
    });

    await finalizeDiscountsOnPaid({
      id: updated.id,
      userId: updated.userId,
      orderNumber: updated.orderNumber,
      pointsUsed: updated.pointsUsed,
      couponClaimId: updated.couponClaimId,
    });

    void notify({
      type: "ORDER_PAID",
      toEmail: updated.user.email,
      subject: `[JH MAKER] 결제 완료 ${updated.orderNumber}`,
      body: `주문 ${updated.orderNumber} 결제가 완료되었습니다.`,
      meta: { orderId: updated.id, amount: updated.totalPrice },
    });

    void earnPointsForOrder({
      userId: updated.userId,
      orderId: updated.id,
      orderTotal: updated.totalPrice,
      orderNumber: updated.orderNumber,
    });

    return NextResponse.json({
      order: toOrderDto(updated),
      tossStatus: confirmed.status,
    });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err) {
      const e = err as Error & { code?: string; status?: number };
      return jsonError(e.message, e.status && e.status < 500 ? e.status : 400);
    }
    return handleApiError(err);
  }
}
