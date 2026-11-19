"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Rotate3d, X } from "lucide-react";
import {
  prepareSpinPreviewTextures,
  revokeSpinPreviewTextures,
  type SpinPreviewTextures,
} from "@/lib/builder/spin-preview-artwork";
import type { ProductMockupFaceDto } from "@/lib/product-mockup";
import type {
  BuilderOptions,
  DesignState,
  MockupOffsetState,
  ViewSide,
} from "@/types/builder";

const SpinPreviewCanvas = dynamic(
  () =>
    import("./SpinPreviewCanvas").then((m) => ({
      default: m.SpinPreviewCanvas,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        3D 미리보기 불러오는 중…
      </div>
    ),
  },
);

type SpinPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  options: BuilderOptions;
  designData: DesignState;
  viewSides: ViewSide[];
  mockupOffsets: MockupOffsetState;
  mockupFaces: ProductMockupFaceDto[];
};

export function SpinPreviewModal({
  open,
  onClose,
  options,
  designData,
  viewSides,
  mockupOffsets,
  mockupFaces,
}: SpinPreviewModalProps) {
  const [textures, setTextures] = useState<SpinPreviewTextures | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTextures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await prepareSpinPreviewTextures(
        options,
        designData,
        viewSides,
        mockupOffsets,
        mockupFaces,
      );
      setTextures((prev) => {
        if (prev) revokeSpinPreviewTextures(prev);
        return next;
      });
    } catch {
      setError("미리보기를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [designData, mockupFaces, mockupOffsets, options, viewSides]);

  useEffect(() => {
    if (!open) return;
    void loadTextures();
  }, [open, loadTextures]);

  useEffect(() => {
    if (open) return;
    setTextures((prev) => {
      if (prev) revokeSpinPreviewTextures(prev);
      return null;
    });
    setError(null);
  }, [open]);

  useEffect(() => {
    return () => {
      setTextures((prev) => {
        if (prev) revokeSpinPreviewTextures(prev);
        return null;
      });
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="spin-preview-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-[min(88dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-zinc-200">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Rotate3d className="h-5 w-5 shrink-0 text-zinc-700" strokeWidth={1.5} />
            <div className="min-w-0">
              <h2
                id="spin-preview-title"
                className="truncate text-sm font-semibold text-zinc-900"
              >
                360° 미리보기
              </h2>
              <p className="text-[11px] text-zinc-500">
                드래그로 돌려 보세요 · 등록 목업·색상·인쇄 반영
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="relative min-h-0 flex-1 bg-zinc-50">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-50/90 text-sm text-zinc-600">
              디자인 합성 중…
            </div>
          )}
          {error && !loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => void loadTextures()}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800"
              >
                다시 시도
              </button>
            </div>
          )}
          {!error && textures && !loading && (
            <SpinPreviewCanvas
              frontUrl={textures.frontUrl}
              backUrl={textures.backUrl}
              frontLayout={textures.frontLayout}
              backLayout={textures.backLayout}
            />
          )}
        </div>

        <footer className="shrink-0 border-t border-zinc-100 px-4 py-2.5 text-[10px] leading-relaxed text-zinc-500">
          2D 빌더·주문 데이터는 변경되지 않습니다.
        </footer>
      </div>
    </div>
  );
}
