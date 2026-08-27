import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { toOrderDto } from "@/lib/orders";
import { isOrderStatus } from "@/lib/order-status";

type RouteContext = { params: Promise<{ id: string }> };

const orderInclude = {
  user: { select: { id: true, name: true, email: true } },
  product: { select: { id: true, name: true, slug: true, saleType: true } },
  items: true,
} as const;

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };

    if (!body.status || !isOrderStatus(body.status)) {
      return jsonError("유효하지 않은 주문 상태입니다.", 400);
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return jsonError("주문을 찾을 수 없습니다.", 404);
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: body.status },
      include: orderInclude,
    });

    return NextResponse.json({ order: toOrderDto(order) });
  } catch (err) {
    return handleApiError(err);
  }
}
