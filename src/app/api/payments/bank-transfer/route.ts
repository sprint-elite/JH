import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { toOrderDto } from "@/lib/orders";
import { assertApiRateLimit } from "@/lib/rate-limit";

/** 무통장 입금 선택 — 결제 대기 상태로 두고 마이페이지로 안내 */
export async function POST(request: Request) {
  try {
    assertApiRateLimit(request, "bank-transfer", 20, 15 * 60 * 1000);
    const user = await requireUser();
    const body = (await request.json()) as { orderId?: string };
    const orderId = body.orderId?.trim();
    if (!orderId) return jsonError("주문 ID가 필요합니다.", 400);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, slug: true, saleType: true } },
        items: true,
      },
    });

    if (!order) return jsonError("주문을 찾을 수 없습니다.", 404);
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return jsonError("접근 권한이 없습니다.", 403);
    }
    if (order.paymentStatus === "PAID") {
      return jsonError("이미 결제가 완료된 주문입니다.", 400);
    }
    if (order.status === "CANCELLED") {
      return jsonError("취소된 주문입니다.", 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: "BANK_TRANSFER",
          status: "UNPAID",
          amount: order.totalPrice,
        },
      });

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: "AWAITING_PAYMENT",
          paymentMethod: "BANK_TRANSFER",
          paymentStatus: "UNPAID",
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

    return NextResponse.json({ order: toOrderDto(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
