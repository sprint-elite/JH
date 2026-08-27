import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { toOrderDto } from "@/lib/orders";
import { applyInternalRefund } from "@/lib/order-refund";

type Ctx = { params: Promise<{ id: string }> };

/** 관리자 환불 처리 — 결제완료 주문 (DB 기준; PG cancel은 별도) */
export async function POST(_request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    try {
      await applyInternalRefund(id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "환불 실패";
      const status =
        msg.includes("찾을 수 없") ? 404 : msg.includes("결제 완료") ? 400 : 500;
      return jsonError(msg, status);
    }

    const updated = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: {
          select: { id: true, name: true, slug: true, saleType: true },
        },
        items: true,
      },
    });
    if (!updated) return jsonError("주문을 찾을 수 없습니다.", 404);

    return NextResponse.json({ order: toOrderDto(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
