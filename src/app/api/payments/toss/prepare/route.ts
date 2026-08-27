import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  getTossClientKey,
  isTossTestMode,
  toTossOrderId,
} from "@/lib/toss";
import { assertApiRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertApiRateLimit(request, "toss-prepare", 30, 15 * 60 * 1000);
    const user = await requireUser();
    const body = (await request.json()) as { orderId?: string };
    const orderId = body.orderId?.trim();
    if (!orderId) return jsonError("주문 ID가 필요합니다.", 400);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { take: 1 },
        product: { select: { name: true } },
      },
    });

    if (!order) return jsonError("주문을 찾을 수 없습니다.", 404);
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return jsonError("접근 권한이 없습니다.", 403);
    }
    if (order.status === "CANCELLED") {
      return jsonError("취소된 주문은 결제할 수 없습니다.", 400);
    }
    if (order.paymentStatus === "PAID") {
      return jsonError("이미 결제가 완료된 주문입니다.", 400);
    }
    if (order.totalPrice < 100) {
      return jsonError("결제 금액이 올바르지 않습니다.", 400);
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "CARD",
        status: "UNPAID",
        amount: order.totalPrice,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "AWAITING_PAYMENT" },
    });

    const productName =
      order.items[0]?.productName ?? order.product.name ?? "JH MAKER 주문";
    const customerKey = user.id.replace(/[^a-zA-Z0-9\-_=.@]/g, "").slice(0, 50);

    return NextResponse.json({
      clientKey: getTossClientKey(),
      testMode: isTossTestMode(),
      tossOrderId: toTossOrderId(payment.id),
      paymentId: payment.id,
      amount: order.totalPrice,
      orderName: `${productName} (${order.orderNumber})`.slice(0, 100),
      orderNumber: order.orderNumber,
      customerKey: customerKey || `guest_${payment.id.slice(0, 20)}`,
      customerName: user.name,
      customerEmail: user.email,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
