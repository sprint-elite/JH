/** 교환·반품 신청 가능한 주문 상태 (결제완료 + 아래 중 하나) */
export const RETURN_ELIGIBLE_ORDER_STATUSES = [
  "CONFIRMED",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
] as const;

export type ReturnEligibleOrderStatus =
  (typeof RETURN_ELIGIBLE_ORDER_STATUSES)[number];

export function isReturnEligibleOrderStatus(
  status: string,
): status is ReturnEligibleOrderStatus {
  return (RETURN_ELIGIBLE_ORDER_STATUSES as readonly string[]).includes(status);
}
