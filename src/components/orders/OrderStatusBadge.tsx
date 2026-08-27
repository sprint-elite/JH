import type { OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200/60",
  AWAITING_PAYMENT: "bg-orange-50 text-orange-700 border-orange-200/60",
  CONFIRMED: "bg-sky-50 text-sky-700 border-sky-200/60",
  IN_PRODUCTION: "bg-violet-50 text-violet-700 border-violet-200/60",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200/60",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusStyles[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
