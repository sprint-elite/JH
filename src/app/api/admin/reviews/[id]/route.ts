import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as {
      isVisible?: boolean;
      isHot?: boolean;
    };

    const existing = await prisma.productReview.findUnique({ where: { id } });
    if (!existing) return jsonError("리뷰를 찾을 수 없습니다.", 404);

    const updated = await prisma.productReview.update({
      where: { id },
      data: {
        ...(body.isVisible !== undefined ? { isVisible: body.isVisible } : {}),
        ...(body.isHot !== undefined ? { isHot: body.isHot } : {}),
      },
    });

    const agg = await prisma.productReview.aggregate({
      where: { productId: existing.productId, isVisible: true },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.product.update({
      where: { id: existing.productId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        reviewCount: agg._count._all,
      },
    });

    return NextResponse.json({ review: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const existing = await prisma.productReview.findUnique({ where: { id } });
    if (!existing) return jsonError("리뷰를 찾을 수 없습니다.", 404);

    await prisma.productReview.delete({ where: { id } });

    const agg = await prisma.productReview.aggregate({
      where: { productId: existing.productId, isVisible: true },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.product.update({
      where: { id: existing.productId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        reviewCount: agg._count._all,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
