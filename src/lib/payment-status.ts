export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "FAILED";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "미입금",
  PAID: "입금완료",
  REFUNDED: "환불",
  FAILED: "실패",
};

const VALID = new Set<string>(Object.keys(PAYMENT_STATUS_LABELS));

export function isPaymentStatus(value: string): value is PaymentStatus {
  return VALID.has(value);
}
