import type { PaymentStatus } from "@/lib/payment-status";
import { PAYMENT_STATUS_LABELS } from "@/lib/payment-status";

const styles: Record<PaymentStatus, string> = {
  UNPAID: "bg-orange-50 text-orange-700 border-orange-200/60",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  REFUNDED: "bg-slate-100 text-slate-600 border-slate-200/60",
  FAILED: "bg-red-50 text-red-700 border-red-200/60",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}
