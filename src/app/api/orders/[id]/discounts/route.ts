import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { applyOrderDiscounts } from "@/lib/order-discounts";
import { toOrderDto } from "@/lib/orders";
import { prisma } from "@/lib/db";
import { assertApiRateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  try {
    assertApiRateLimit(request, "orders-discounts", 60, 15 * 60 * 1000);
    const user = await requireUser();
    const { id } = await context.params;
    const body = (await request.json()) as {
      couponCode?: string | null;
      pointsToUse?: number;
      clearCoupon?: boolean;
    };

    const updated = await applyOrderDiscounts({
      orderId: id,
      userId: user.id,
      couponCode: body.couponCode,
      pointsToUse: body.pointsToUse,
      clearCoupon: body.clearCoupon,
    });

    const pointsBalance =
      (
        await prisma.user.findUnique({
          where: { id: user.id },
          select: { pointsBalance: true },
        })
      )?.pointsBalance ?? 0;

    return NextResponse.json({
      order: toOrderDto(updated),
      pointsBalance,
    });
  } catch (err) {
    if (err instanceof Error && "status" in err) {
      return jsonError(
        err.message,
        (err as Error & { status: number }).status,
      );
    }
    return handleApiError(err);
  }
}
