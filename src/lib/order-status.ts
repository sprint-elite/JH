import type { OrderStatus } from "@/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "대기",
  AWAITING_PAYMENT: "입금대기",
  CONFIRMED: "확인됨",
  IN_PRODUCTION: "제작 중",
  SHIPPED: "배송 중",
  DELIVERED: "배송 완료",
  CANCELLED: "취소",
};

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: ORDER_STATUS_LABELS.PENDING },
  { value: "AWAITING_PAYMENT", label: ORDER_STATUS_LABELS.AWAITING_PAYMENT },
  { value: "CONFIRMED", label: ORDER_STATUS_LABELS.CONFIRMED },
  { value: "IN_PRODUCTION", label: ORDER_STATUS_LABELS.IN_PRODUCTION },
  { value: "SHIPPED", label: ORDER_STATUS_LABELS.SHIPPED },
  { value: "DELIVERED", label: ORDER_STATUS_LABELS.DELIVERED },
  { value: "CANCELLED", label: ORDER_STATUS_LABELS.CANCELLED },
];

const VALID_STATUSES = new Set<string>(Object.keys(ORDER_STATUS_LABELS));

export function isOrderStatus(value: string): value is OrderStatus {
  return VALID_STATUSES.has(value);
}
