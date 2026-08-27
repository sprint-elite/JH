import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { applyInternalRefund } from "@/lib/order-refund";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: string;
      adminNote?: string;
    };
    const status = body.status?.trim();
    if (
      status &&
      !["PENDING", "APPROVED", "REJECTED", "DONE"].includes(status)
    ) {
      return jsonError("상태가 올바르지 않습니다.", 400);
    }

    const existing = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            paymentStatus: true,
            status: true,
          },
        },
      },
    });
    if (!existing) return jsonError("신청을 찾을 수 없습니다.", 404);

    const prevStatus = existing.status;
    const nextStatus = status ?? prevStatus;

    let refundApplied = false;
    // 반품 완료 전: 결제완료면 재고·환불상태·주문취소 먼저 연동
    if (
      existing.type === "RETURN" &&
      nextStatus === "DONE" &&
      prevStatus !== "DONE" &&
      existing.order.paymentStatus === "PAID"
    ) {
      try {
        const result = await applyInternalRefund(existing.orderId);
        refundApplied = result.changed;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "환불 연동 실패";
        return jsonError(`환불 연동에 실패해 완료 처리할 수 없습니다: ${msg}`, 409);
      }
    }

    const row = await prisma.returnRequest.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(body.adminNote !== undefined
          ? { adminNote: body.adminNote.trim() || null }
          : {}),
      },
    });

    return NextResponse.json({
      returnRequest: {
        id: row.id,
        status: row.status,
        adminNote: row.adminNote,
        refundApplied,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
