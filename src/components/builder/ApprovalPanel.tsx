"use client";

import { useBuilderStore } from "@/store";
import type { ApprovalStatus } from "@/types/builder";
import { APPROVAL_STATUS_LABELS } from "@/types/builder";

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  DRAFT: "bg-zinc-200 text-zinc-700",
  REVISION_REQUESTED: "bg-amber-100 text-amber-800",
  WAITING_APPROVAL: "bg-blue-100 text-blue-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
};

interface ApprovalPanelProps {
  onGenerateWorkOrder?: () => void;
}

export function ApprovalPanel({ onGenerateWorkOrder }: ApprovalPanelProps) {
  const approvalStatus = useBuilderStore((s) => s.approvalStatus);
  const setApprovalStatus = useBuilderStore((s) => s.setApprovalStatus);

  return (
    <div className="rounded border border-zinc-200 p-2 text-xs">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-semibold text-zinc-700">승인</span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[approvalStatus]}`}
        >
          {APPROVAL_STATUS_LABELS[approvalStatus]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Btn
          label="수정요청"
          onClick={() => setApprovalStatus("REVISION_REQUESTED")}
        />
        <Btn
          label="승인요청"
          onClick={() => setApprovalStatus("WAITING_APPROVAL")}
        />
        <Btn
          label="최종승인"
          onClick={() => setApprovalStatus("APPROVED")}
          primary
        />
        <Btn
          label="작업지시"
          onClick={() => onGenerateWorkOrder?.()}
          disabled={approvalStatus !== "APPROVED"}
        />
      </div>
    </div>
  );
}

function Btn({
  label,
  onClick,
  primary,
  disabled,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded py-1 text-[10px] font-medium disabled:opacity-40 ${
        primary
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}
