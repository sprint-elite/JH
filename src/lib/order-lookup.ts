import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth-validation";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import {
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
} from "@/lib/payment-status";
import type { OrderStatus } from "@/types";

export type PublicOrderLookup = {
  orderNumber: string;
  productName: string;
  quantity: number;
  status: string;
  statusLabel: string;
  paymentStatus: string;
  paymentLabel: string;
  trackingNumber: string | null;
  createdAt: string;
  totalPrice: number;
};

export async function lookupOrderByNumberAndEmail(
  orderNumber: string,
  email: string,
): Promise<PublicOrderLookup | null> {
  const number = orderNumber.trim().toUpperCase();
  const userEmail = normalizeEmail(email);
  if (!number || !userEmail) return null;

  const row = await prisma.order.findFirst({
    where: {
      orderNumber: number,
      user: { email: userEmail },
    },
    include: {
      product: { select: { name: true } },
      items: { take: 1, select: { productName: true } },
    },
  });
  if (!row) return null;

  const productName = row.items[0]?.productName ?? row.product.name;
  return {
    orderNumber: row.orderNumber,
    productName,
    quantity: row.quantity,
    status: row.status,
    statusLabel: ORDER_STATUS_LABELS[row.status as OrderStatus] ?? row.status,
    paymentStatus: row.paymentStatus,
    paymentLabel:
      PAYMENT_STATUS_LABELS[row.paymentStatus as PaymentStatus] ??
      row.paymentStatus,
    trackingNumber: row.trackingNumber,
    createdAt: row.createdAt.toISOString(),
    totalPrice: row.totalPrice,
  };
}

export function formatOrderLookupText(row: PublicOrderLookup): string {
  const ship = row.trackingNumber
    ? `\n송장번호: ${row.trackingNumber}`
    : "\n송장번호는 아직 없어요. 출고되면 안내됩니다.";
  return `${row.orderNumber}\n${row.productName} · ${row.quantity}장\n진행: ${row.statusLabel}\n결제: ${row.paymentLabel}${ship}`;
}
