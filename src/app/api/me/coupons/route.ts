import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    const claims = await prisma.couponClaim.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { coupon: true },
    });
    return NextResponse.json({
      coupons: claims.map((c) => ({
        claimId: c.id,
        claimedAt: c.createdAt.toISOString(),
        code: c.coupon.code,
        name: c.coupon.name,
        discountType: c.coupon.discountType,
        discountValue: c.coupon.discountValue,
        minOrderAmount: c.coupon.minOrderAmount,
        isActive: c.coupon.isActive,
        endsAt: c.coupon.endsAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim().toUpperCase();
    if (!code) return jsonError("쿠폰 코드를 입력해 주세요.", 400);

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      return jsonError("유효하지 않은 쿠폰입니다.", 400);
    }
    const now = Date.now();
    if (coupon.startsAt && coupon.startsAt.getTime() > now) {
      return jsonError("아직 사용할 수 없는 쿠폰입니다.", 400);
    }
    if (coupon.endsAt && coupon.endsAt.getTime() < now) {
      return jsonError("만료된 쿠폰입니다.", 400);
    }

    const claimCount = await prisma.couponClaim.count({
      where: { couponId: coupon.id },
    });
    if (coupon.usageLimit != null && claimCount >= coupon.usageLimit) {
      return jsonError("쿠폰 발급이 마감되었습니다.", 400);
    }

    const mine = await prisma.couponClaim.count({
      where: { couponId: coupon.id, userId: user.id },
    });
    if (mine >= coupon.perUserLimit) {
      return jsonError("이미 등록한 쿠폰입니다.", 400);
    }

    await prisma.couponClaim.create({
      data: { couponId: coupon.id, userId: user.id },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
