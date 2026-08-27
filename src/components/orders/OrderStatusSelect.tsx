"use client";

import { useState } from "react";
import type { OrderStatus } from "@/types";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
} from "@/lib/order-status";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrderStatusSelectProps {
  status: OrderStatus;
  onChange: (status: OrderStatus) => Promise<void>;
  disabled?: boolean;
}

export function OrderStatusSelect({
  status,
  onChange,
  disabled,
}: OrderStatusSelectProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (next: OrderStatus) => {
    if (next === status || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={status} />
        <select
          value={status}
          disabled={disabled || saving}
          onChange={(e) => void handleChange(e.target.value as OrderStatus)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
          aria-label="주문 상태 변경"
        >
          {ORDER_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {ORDER_STATUS_LABELS[opt.value]}
            </option>
          ))}
        </select>
        {saving && (
          <span className="text-xs text-slate-400">저장 중…</span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
