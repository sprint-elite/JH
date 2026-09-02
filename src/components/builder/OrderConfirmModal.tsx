"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { ShippingAddressFields } from "@/components/checkout/ShippingAddressFields";
import {
  calculatePrice,
  formatKRW,
  FREE_SHIPPING_THRESHOLD,
  resolveShippingFee,
  SHIPPING_FEE,
} from "@/lib/pricing";
import { getProductTitle } from "@/lib/fabric/mockup-builder";
import {
  validateShippingInput,
  type OrderShippingInput,
} from "@/lib/order-shipping";
import {
  BAG_COLOR_LABELS,
  PRINT_SIDE_LABELS,
  SIZE_LABELS,
} from "@/types/builder";
import type { BuilderOptions } from "@/types/builder";

export type OrderConfirmMode = "create" | "update";

export type OrderConfirmData = {
  title: string;
  options: BuilderOptions;
  unitPrice: number;
  totalPrice: number;
  mode?: OrderConfirmMode;
  orderNumber?: string;
  initialShipping?: Partial<OrderShippingInput>;
};

interface OrderConfirmModalProps {
  open: boolean;
  data: OrderConfirmData | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (shipping: OrderShippingInput) => void | Promise<void>;
}

const EMPTY_SHIPPING: OrderShippingInput = {
  shippingName: "",
  shippingPhone: "",
  shippingAddress: "",
  shippingZip: "",
  notes: "",
};

export function OrderConfirmModal({
  open,
  data,
  submitting,
  onClose,
  onConfirm,
}: OrderConfirmModalProps) {
  const [form, setForm] = useState<OrderShippingInput>(EMPTY_SHIPPING);
  const [error, setError] = useState<string | null>(null);

  const price = useMemo(
    () => (data ? calculatePrice(data.options) : null),
    [data],
  );

  const merchandise = data?.totalPrice ?? price?.totalPrice ?? 0;
  const shippingFee = resolveShippingFee(merchandise, SHIPPING_FEE);
  const payTotal = merchandise + shippingFee;

  const isUpdate = data?.mode === "update";

  useEffect(() => {
    if (open && data) {
      setForm({
        shippingName: data.initialShipping?.shippingName ?? "",
        shippingPhone: data.initialShipping?.shippingPhone ?? "",
        shippingAddress: data.initialShipping?.shippingAddress ?? "",
        shippingZip: data.initialShipping?.shippingZip ?? "",
        notes: data.initialShipping?.notes ?? "",
      });
      setError(null);
    }
  }, [open, data]);

  if (!open || !data) return null;

  const title = data.title || getProductTitle(data.options);

  const handleClose = () => {
    if (submitting) return;
    setForm(EMPTY_SHIPPING);
    setError(null);
    onClose();
  };

  const handleSubmit = () => {
    const validationError = validateShippingInput(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    void onConfirm({
      shippingName: form.shippingName.trim(),
      shippingPhone: form.shippingPhone.trim(),
      shippingAddress: form.shippingAddress.trim(),
      shippingZip: form.shippingZip?.trim() || "",
      notes: form.notes?.trim() || "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h3 className="text-base font-semibold text-zinc-900">
            {isUpdate ? "주문 수정 확인" : "주문 정보 확인"}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {isUpdate && data.orderNumber && (
            <p className="rounded-lg bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-700">
              {data.orderNumber}
            </p>
          )}
          <div>
            <p className="text-xs text-zinc-400">상품</p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-900">{title}</p>
          </div>

          <div className="space-y-2 rounded-lg bg-zinc-50 px-4 py-3 text-sm">
            <SummaryRow label="사이즈" value={SIZE_LABELS[data.options.size]} />
            <SummaryRow
              label="색상"
              value={BAG_COLOR_LABELS[data.options.bagColor]}
            />
            <SummaryRow
              label="인쇄면"
              value={PRINT_SIDE_LABELS[data.options.printSide]}
            />
            <SummaryRow label="수량" value={`${data.options.quantity}개`} />
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>단가</span>
              <span>{formatKRW(data.unitPrice)}</span>
            </div>
            {price && price.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>수량 할인 ({Math.round(price.discountRate * 100)}%)</span>
                <span>-{formatKRW(price.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-600">
              <span>배송비</span>
              <span>
                {shippingFee === 0 ? "무료" : formatKRW(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-100 pt-2 font-semibold text-zinc-900">
              <span>결제 예정 금액</span>
              <span>{formatKRW(payTotal)}</span>
            </div>
            <p className="text-[10px] text-zinc-400">
              * {formatKRW(FREE_SHIPPING_THRESHOLD)} 이상 무료배송
            </p>
          </div>

          <div className="space-y-3 border-t border-zinc-100 pt-4">
            <p className="text-sm font-semibold text-zinc-900">배송 · 연락 정보</p>
            <ShippingAddressFields
              value={form}
              onChange={(next) => {
                setForm(next);
                setError(null);
              }}
              disabled={submitting}
              compact
            />
          </div>

          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-zinc-100 px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting
              ? isUpdate
                ? "저장 중…"
                : "주문 처리 중…"
              : isUpdate
                ? "수정 저장"
                : "주문 확정"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-800">{value}</span>
    </div>
  );
}
