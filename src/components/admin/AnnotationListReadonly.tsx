"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MapPin, RotateCcw } from "lucide-react";
import type { AnnotationItem, AnnotationStatus, ViewSide } from "@/types/builder";
import {
  ANNOTATION_STATUS_LABELS,
  resolveSideLabel,
} from "@/types/builder";

interface AnnotationListReadonlyProps {
  annotations: AnnotationItem[];
  activeId?: string | null;
  onSelect?: (id: string, side: ViewSide) => void;
  /** 관리자 완료/재오픈 — 전달 시 액션 버튼 표시 */
  onStatusChange?: (
    annotationId: string,
    status: AnnotationStatus,
  ) => Promise<void>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AnnotationListReadonly({
  annotations,
  activeId,
  onSelect,
  onStatusChange,
}: AnnotationListReadonlyProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sorted = [...annotations].sort((a, b) => a.number - b.number);
  const openCount = annotations.filter((a) => a.status === "open").length;

  const handleStatus = async (
    item: AnnotationItem,
    status: AnnotationStatus,
  ) => {
    if (!onStatusChange) return;
    setBusyId(item.id);
    setError(null);
    try {
      await onStatusChange(item.id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setBusyId(null);
    }
  };

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
        <MapPin className="h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-600">
          등록된 작업 요청이 없습니다
        </p>
        <p className="mt-1 text-xs text-slate-400">
          고객이 빌더에서 주석을 남기면 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        총 {sorted.length}건 · 미처리 {openCount}건
        {onStatusChange && (
          <span className="mt-1 block text-slate-400">
            완료 처리는 관리자만 할 수 있습니다.
          </span>
        )}
      </p>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      <ul className="space-y-2">
        {sorted.map((item) => (
          <li
            key={item.id}
            className={`rounded-xl border px-4 py-3 transition-colors ${
              activeId === item.id
                ? "border-blue-300 bg-blue-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect?.(item.id, item.side)}
              className="w-full text-left"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {item.number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {resolveSideLabel(item.side)}
                    </span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                        item.status === "open"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {ANNOTATION_STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {item.message}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {formatDate(item.createdAt)}
                    {item.author ? ` · ${item.author}` : ""}
                  </p>
                </div>
              </div>
            </button>

            {onStatusChange && (
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3 pl-10">
                {item.status === "open" ? (
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void handleStatus(item, "resolved")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {busyId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    완료 처리
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void handleStatus(item, "open")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {busyId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    다시 열기
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
