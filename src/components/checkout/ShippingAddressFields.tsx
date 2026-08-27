"use client";

import { useDaumPostcode } from "@/hooks/useDaumPostcode";
import type { OrderShippingInput } from "@/lib/order-shipping";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400";

interface ShippingAddressFieldsProps {
  value: OrderShippingInput;
  onChange: (next: OrderShippingInput) => void;
  disabled?: boolean;
  /** compact = 모달용 약간 작은 스타일 */
  compact?: boolean;
  showNotes?: boolean;
}

export function ShippingAddressFields({
  value,
  onChange,
  disabled,
  compact,
  showNotes = true,
}: ShippingAddressFieldsProps) {
  const { openPostcode } = useDaumPostcode();
  const cls = compact
    ? "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
    : inputClass;

  const set = <K extends keyof OrderShippingInput>(
    key: K,
    v: OrderShippingInput[K],
  ) => onChange({ ...value, [key]: v });

  const handleSearch = async () => {
    const result = await openPostcode();
    if (!result) return;
    onChange({
      ...value,
      shippingZip: result.zipCode,
      shippingAddress: value.shippingAddress?.includes(result.address)
        ? value.shippingAddress
        : result.address,
    });
  };

  return (
    <div className="space-y-3">
      <Field
        label="고객명"
        required
        className={cls}
        disabled={disabled}
        value={value.shippingName}
        onChange={(v) => set("shippingName", v)}
        autoComplete="name"
      />
      <Field
        label="연락처"
        required
        className={cls}
        disabled={disabled}
        value={value.shippingPhone}
        onChange={(v) => set("shippingPhone", v)}
        autoComplete="tel"
        inputMode="tel"
        placeholder="010-0000-0000"
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          우편번호
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value.shippingZip ?? ""}
            readOnly
            disabled={disabled}
            placeholder="검색 버튼으로 입력"
            className={`${cls} flex-1 bg-zinc-50`}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => void handleSearch()}
            className="shrink-0 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            주소 검색
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          배송 주소 <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={2}
          disabled={disabled}
          value={value.shippingAddress}
          onChange={(e) => set("shippingAddress", e.target.value)}
          placeholder="도로명 주소 (검색 후 상세 주소를 이어서 입력)"
          autoComplete="street-address"
          className={`${cls} resize-none`}
        />
      </div>
      {showNotes ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            요청사항 (선택)
          </label>
          <textarea
            rows={2}
            disabled={disabled}
            value={value.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="배송·제작 관련 요청사항"
            className={`${cls} resize-none`}
          />
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  className,
  disabled,
  placeholder,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className: string;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={className}
      />
    </div>
  );
}
