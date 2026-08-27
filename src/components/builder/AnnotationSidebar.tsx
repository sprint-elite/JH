"use client";

import { MapPin, Pencil, Trash2 } from "lucide-react";
import { useBuilderStore } from "@/store";
import { useBuilderProduct } from "@/components/builder/BuilderProductContext";
import { ANNOTATION_STATUS_LABELS, resolveSideLabel } from "@/types/builder";

export function AnnotationSidebar() {
  return <AnnotationPanelContent />;
}

export function AnnotationPanelContent() {
  const annotations = useBuilderStore((s) => s.annotations);
  const currentSide = useBuilderStore((s) => s.currentSide);
  const annotationMode = useBuilderStore((s) => s.annotationMode);
  const activeId = useBuilderStore((s) => s.activeAnnotationId);
  const setAnnotationMode = useBuilderStore((s) => s.setAnnotationMode);
  const setActiveId = useBuilderStore((s) => s.setActiveAnnotationId);
  const setEditingId = useBuilderStore((s) => s.setEditingAnnotationId);
  const deleteAnnotation = useBuilderStore((s) => s.deleteAnnotation);
  const product = useBuilderProduct();
  const faces = product?.mockupFaces ?? [];

  const sideAnnotations = annotations
    .filter((a) => a.side === currentSide)
    .sort((a, b) => a.number - b.number);

  const totalOpen = annotations.filter((a) => a.status === "open").length;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-100 px-4 py-4">
        <p className="text-xs text-zinc-500">
          {resolveSideLabel(currentSide, faces)} · 미처리 {totalOpen}건
        </p>

        <button
          type="button"
          onClick={() => setAnnotationMode(!annotationMode)}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
            annotationMode
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}
        >
          <MapPin className="h-4 w-4" />
          {annotationMode ? "주석 위치 선택 중…" : "주석 달기"}
        </button>

        {annotationMode && (
          <p className="mt-2 text-center text-[11px] text-blue-600">
            제품 화면을 클릭해 위치를 지정하세요
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-1 text-xs font-semibold text-zinc-500">
          요청 내역 ({sideAnnotations.length})
        </p>

        {sideAnnotations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-8 text-center text-xs text-zinc-400">
            아직 주석이 없습니다.
            <br />
            주석 달기로 위치를 지정해 보세요.
          </div>
        ) : (
          <ul className="space-y-2">
            {sideAnnotations.map((item) => (
              <li
                key={item.id}
                className={`rounded-lg border px-3 py-2.5 transition-colors ${
                  activeId === item.id
                    ? "border-blue-300 bg-blue-50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setActiveId(item.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-white">
                      {item.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {item.title}
                        </p>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            item.status === "open"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {ANNOTATION_STATUS_LABELS[item.status]}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                        {item.message}
                      </p>
                      <p className="mt-1.5 text-[10px] text-zinc-400">
                        {formatDate(item.createdAt)} · {item.author}
                      </p>
                    </div>
                  </div>
                </button>

                <div className="mt-2 flex gap-1.5 pl-8">
                  <button
                    type="button"
                    onClick={() => setEditingId(item.id)}
                    className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    <Pencil className="h-3 w-3" />
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAnnotation(item.id)}
                    className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-3 w-3" />
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
