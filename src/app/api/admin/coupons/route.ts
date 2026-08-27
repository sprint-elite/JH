import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { claims: true } } },
    });
    return NextResponse.json({
      coupons: coupons.map((c) => ({
        ...c,
        claimCount: c._count.claims,
        startsAt: c.startsAt?.toISOString() ?? null,
        endsAt: c.endsAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      code?: string;
      name?: string;
      discountType?: string;
      discountValue?: number;
      minOrderAmount?: number;
      maxDiscount?: number | null;
      usageLimit?: number | null;
      perUserLimit?: number;
      isActive?: boolean;
    };

    const code = body.code?.trim().toUpperCase();
    const name = body.name?.trim();
    const discountType = body.discountType === "PERCENT" ? "PERCENT" : "FIXED";
    const discountValue = Math.round(Number(body.discountValue));

    if (!code || !name) return jsonError("코드와 이름을 입력해 주세요.", 400);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return jsonError("할인 값이 올바르지 않습니다.", 400);
    }
    if (discountType === "PERCENT" && discountValue > 100) {
      return jsonError("퍼센트 할인은 100 이하여야 합니다.", 400);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        name,
        discountType,
        discountValue,
        minOrderAmount: Math.max(0, Math.round(Number(body.minOrderAmount) || 0)),
        maxDiscount:
          body.maxDiscount != null ? Math.round(Number(body.maxDiscount)) : null,
        usageLimit:
          body.usageLimit != null ? Math.round(Number(body.usageLimit)) : null,
        perUserLimit: Math.max(1, Math.round(Number(body.perUserLimit) || 1)),
        isActive: body.isActive !== false,
      },
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
