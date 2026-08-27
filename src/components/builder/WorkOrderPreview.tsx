"use client";

import { X } from "lucide-react";
import type { WorkOrderData } from "@/types/builder";

interface WorkOrderPreviewProps {
  open: boolean;
  data: WorkOrderData | null;
  onClose: () => void;
}

export function WorkOrderPreview({ open, data, onClose }: WorkOrderPreviewProps) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-zinc-900">작업지시 데이터</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <Info label="주문번호" value={data.orderNo} />
            <Info
              label="생성 시각"
              value={new Date(data.generatedAt).toLocaleString("ko-KR")}
            />
            <Info label="수량" value={`${data.quantity}개`} />
          </div>

          <h3 className="mb-2 text-sm font-semibold text-zinc-700">공정 지시</h3>
          <ol className="mb-4 space-y-2">
            {data.processes.map((p, i) => (
              <li
                key={p.name}
                className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-zinc-800">
                  {i + 1}. {p.name}
                </span>
                <p className="mt-0.5 text-zinc-600">{p.instruction}</p>
              </li>
            ))}
          </ol>

          <h3 className="mb-2 text-sm font-semibold text-zinc-700">JSON 미리보기</h3>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs leading-relaxed text-emerald-300">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2 text-sm">
      <span className="text-zinc-500">{label}: </span>
      <span className="font-medium text-zinc-800">{value}</span>
    </div>
  );
}

interface JsonModalProps {
  open: boolean;
  json: string;
  onClose: () => void;
}

export function JsonModal({ open, json, onClose }: JsonModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold text-zinc-900">디자인 JSON</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <pre className="overflow-auto p-4 text-xs text-zinc-700">{json}</pre>
      </div>
    </div>
  );
}
