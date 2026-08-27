import { prisma } from "@/lib/db";
import { calcCouponDiscount, calcPayableTotal } from "@/lib/checkout-discounts";

export function merchandiseFromOrder(order: {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalPrice: number;
  couponDiscount: number;
  pointsUsed: number;
}) {
  // 쿠폰·포인트 적용 전 상품 합계
  return (
    order.totalPrice -
    order.shippingFee +
    order.couponDiscount +
    order.pointsUsed
  );
}

/** 미결제 주문에 쿠폰·포인트 적용 */
export async function applyOrderDiscounts(input: {
  orderId: string;
  userId: string;
  couponCode?: string | null;
  pointsToUse?: number;
  clearCoupon?: boolean;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
  });
  if (!order) throw Object.assign(new Error("주문을 찾을 수 없습니다."), { status: 404 });
  if (order.userId !== input.userId) {
    throw Object.assign(new Error("접근 권한이 없습니다."), { status: 403 });
  }
  if (order.paymentStatus !== "UNPAID") {
    throw Object.assign(new Error("미결제 주문만 할인 적용이 가능합니다."), {
      status: 400,
    });
  }

  const merchandise = merchandiseFromOrder(order);
  let couponDiscount = 0;
  let couponClaimId: string | null = null;

  // 기존 쿠폰 예약 해제
  if (order.couponClaimId) {
    await prisma.couponClaim.updateMany({
      where: { id: order.couponClaimId, usedAt: null },
      data: { orderId: null },
    });
  }

  if (!input.clearCoupon && input.couponCode?.trim()) {
    const code = input.couponCode.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      throw Object.assign(new Error("유효하지 않은 쿠폰입니다."), { status: 400 });
    }
    const now = Date.now();
    if (coupon.startsAt && coupon.startsAt.getTime() > now) {
      throw Object.assign(new Error("아직 사용할 수 없는 쿠폰입니다."), {
        status: 400,
      });
    }
    if (coupon.endsAt && coupon.endsAt.getTime() < now) {
      throw Object.assign(new Error("만료된 쿠폰입니다."), { status: 400 });
    }

    let claim = await prisma.couponClaim.findUnique({
      where: {
        couponId_userId: { couponId: coupon.id, userId: input.userId },
      },
    });
    if (!claim) {
      claim = await prisma.couponClaim.create({
        data: { couponId: coupon.id, userId: input.userId },
      });
    }
    if (claim.usedAt && claim.orderId !== order.id) {
      throw Object.assign(new Error("이미 사용된 쿠폰입니다."), { status: 400 });
    }

    couponDiscount = calcCouponDiscount(coupon, merchandise);
    if (couponDiscount <= 0) {
      throw Object.assign(
        new Error(
          `최소 주문 금액 ${coupon.minOrderAmount.toLocaleString()}원 이상이어야 합니다.`,
        ),
        { status: 400 },
      );
    }
    couponClaimId = claim.id;
    await prisma.couponClaim.update({
      where: { id: claim.id },
      data: { orderId: order.id },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { pointsBalance: true, isGuest: true },
  });
  const maxPoints = user && !user.isGuest ? user.pointsBalance : 0;
  const afterCoupon = Math.max(0, merchandise + order.shippingFee - couponDiscount);
  let pointsUsed = Math.max(0, Math.floor(Number(input.pointsToUse) || 0));
  pointsUsed = Math.min(pointsUsed, maxPoints, afterCoupon);

  const totalPrice = calcPayableTotal({
    merchandiseTotal: merchandise,
    shippingFee: order.shippingFee,
    couponDiscount,
    pointsUsed,
  });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      couponDiscount,
      pointsUsed,
      couponClaimId,
      totalPrice,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: {
        select: { id: true, name: true, slug: true, saleType: true },
      },
      items: true,
    },
  });

  return updated;
}

/** 결제 완료 시 쿠폰 usedAt 마킹 + 포인트 차감 */
export async function finalizeDiscountsOnPaid(order: {
  id: string;
  userId: string;
  orderNumber: string;
  pointsUsed: number;
  couponClaimId: string | null;
}) {
  if (order.couponClaimId) {
    await prisma.couponClaim.updateMany({
      where: { id: order.couponClaimId, usedAt: null },
      data: { usedAt: new Date(), orderId: order.id },
    });
  }
  if (order.pointsUsed > 0) {
    const { spendPointsForOrder } = await import("@/lib/points");
    await spendPointsForOrder({
      userId: order.userId,
      orderId: order.id,
      amount: order.pointsUsed,
      orderNumber: order.orderNumber,
    });
  }
}
