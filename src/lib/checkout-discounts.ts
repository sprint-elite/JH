import type { Coupon } from "@prisma/client";

export function calcCouponDiscount(
  coupon: Pick<
    Coupon,
    "discountType" | "discountValue" | "minOrderAmount" | "maxDiscount"
  >,
  merchandiseTotal: number,
): number {
  if (merchandiseTotal < coupon.minOrderAmount) return 0;
  let discount =
    coupon.discountType === "PERCENT"
      ? Math.floor((merchandiseTotal * coupon.discountValue) / 100)
      : coupon.discountValue;
  if (coupon.maxDiscount != null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  return Math.max(0, Math.min(discount, merchandiseTotal));
}

/** 상품합 + 배송비 − 쿠폰 − 포인트 */
export function calcPayableTotal(input: {
  merchandiseTotal: number;
  shippingFee: number;
  couponDiscount?: number;
  pointsUsed?: number;
}): number {
  const base =
    input.merchandiseTotal +
    input.shippingFee -
    (input.couponDiscount ?? 0) -
    (input.pointsUsed ?? 0);
  return Math.max(0, base);
}
