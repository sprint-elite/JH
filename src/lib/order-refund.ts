import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { restoreStock } from "@/lib/inventory";
import { reversePointsForOrder } from "@/lib/points";
import { notify } from "@/lib/notify";
import { brandedMailSubject } from "@/lib/site-settings";

type OrderForRefund = {
  id: string;
  orderNumber: string;
  userId: string;
  totalPrice: number;
  paymentStatus: string;
  paymentMethod: string | null;
  items: Array<{ productId: string; quantity: number }>;
  user: { email: string };
};

/**
 * DB 기준 환불 처리 (재고 복구 · Payment REFUNDED · 주문 취소 · 포인트 되돌림).
 * 이미 REFUNDED면 no-op. PG(토스 cancel)는 별도 연동.
 */
export async function applyInternalRefund(orderId: string): Promise<{
  changed: boolean;
  orderNumber: string;
  userEmail: string;
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { email: true } },
      items: { select: { productId: true, quantity: true } },
    },
  });
  if (!order) {
    throw new Error("주문을 찾을 수 없습니다.");
  }
  if (order.paymentStatus === "REFUNDED") {
    return {
      changed: false,
      orderNumber: order.orderNumber,
      userEmail: order.user.email,
    };
  }
  if (order.paymentStatus !== "PAID") {
    throw new Error("결제 완료 주문만 환불할 수 있습니다.");
  }

  const alreadyRestored = order.status === "CANCELLED";

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (!alreadyRestored) {
      for (const item of order.items) {
        await restoreStock(item.productId, item.quantity, tx);
      }
    }
    await tx.payment.create({
      data: {
        orderId: order.id,
        method: order.paymentMethod ?? "CARD",
        status: "REFUNDED",
        amount: order.totalPrice,
        paidAt: new Date(),
        transactionId: `refund_${Date.now()}`,
      },
    });
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "REFUNDED",
        status: "CANCELLED",
      },
    });
  });

  void reversePointsForOrder({
    userId: order.userId,
    orderId: order.id,
    orderNumber: order.orderNumber,
  });

  void notify({
    type: "ORDER_CANCELLED",
    toEmail: order.user.email,
    subject: await brandedMailSubject(`환불 처리 ${order.orderNumber}`),
    body: `주문 ${order.orderNumber} 환불이 처리되었습니다.`,
    meta: { orderId: order.id },
  });

  return {
    changed: true,
    orderNumber: order.orderNumber,
    userEmail: order.user.email,
  };
}

/** 타입 가드용 — 테스트/확장 */
export type { OrderForRefund };
