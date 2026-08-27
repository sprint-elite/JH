"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  downloadArtworkPng,
  formatArtworkExportLabel,
} from "@/lib/fabric/export-artwork";
import { getPrintExportPixelSize } from "@/lib/fabric/print-export";
import type { SavedBuilderPayload } from "@/types/saved-design";
import {
  getDesignViewSides,
  resolveSideLabel,
  type ViewSide,
} from "@/types/builder";

function sidesFromPayload(payload: SavedBuilderPayload): ViewSide[] {
  const fromDesign = Object.keys(payload.designData ?? {});
  const fromOffsets = Object.keys(payload.mockupOffsets ?? {});
  const merged = [...new Set([...fromDesign, ...fromOffsets])];
  if (merged.length > 0) return merged;
  return getDesignViewSides(
    payload.options.productType,
    payload.options.printSide,
  );
}

interface ArtworkDownloadPanelProps {
  orderNumber: string;
  payload: SavedBuilderPayload;
  currentSide: ViewSide;
}

export function ArtworkDownloadPanel({
  orderNumber,
  payload,
  currentSide,
}: ArtworkDownloadPanelProps) {
  const [busy, setBusy] = useState<ViewSide | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastInfo, setLastInfo] = useState<string | null>(null);

  const sides = sidesFromPayload(payload);
  const pixelSize = getPrintExportPixelSize(payload.options);

  const hasSideDesign = (side: ViewSide) => {
    const objects = payload.designData[side]?.objects;
    return Array.isArray(objects) && objects.length > 0;
  };

  const runDownload = async (side: ViewSide) => {
    setBusy(side);
    setError(null);
    setLastInfo(null);
    try {
      if (!hasSideDesign(side)) {
        throw new Error(`${resolveSideLabel(side)}에 저장된 디자인이 없습니다.`);
      }

      const result = await downloadArtworkPng(
        payload.designData[side],
        payload.options,
        side,
        payload.mockupOffsets[side],
        { orderNumber },
      );

      if (!result) {
        throw new Error(`${resolveSideLabel(side)} 작업물 다운로드에 실패했습니다.`);
      }

      setLastInfo(
        `${resolveSideLabel(side)} · ${result.widthPx}×${result.heightPx}px · ${result.dpi}dpi`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "다운로드 실패");
    } finally {
      setBusy(null);
    }
  };

  const runDownloadAll = async () => {
    setBusy("all");
    setError(null);
    setLastInfo(null);
    try {
      let count = 0;
      for (const side of sides) {
        if (!hasSideDesign(side)) continue;
        await downloadArtworkPng(
          payload.designData[side],
          payload.options,
          side,
          payload.mockupOffsets[side],
          { orderNumber },
        );
        count += 1;
        await new Promise((r) => setTimeout(r, 300));
      }
      if (count === 0) {
        throw new Error("다운로드할 디자인 면이 없습니다.");
      }
      setLastInfo(`${count}개 면 PNG 다운로드 완료`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "다운로드 실패");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            인쇄용 작업물 (PNG)
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            인쇄 영역 기준 실측{" "}
            <span className="font-medium text-slate-700">
              {pixelSize.widthCm}×{pixelSize.heightCm}cm
            </span>
            , {pixelSize.dpi}dpi · 투명 배경 · 목업·가이드 제외
          </p>
        </div>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void runDownloadAll()}
          className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
        >
          {busy === "all" ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              처리 중
            </span>
          ) : (
            "전체 면"
          )}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {sides.map((side) => {
          const hasDesign = hasSideDesign(side);
          const isCurrent = side === currentSide;

          return (
            <button
              key={side}
              type="button"
              disabled={!hasDesign || busy !== null}
              onClick={() => void runDownload(side)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isCurrent
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {busy === side ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {formatArtworkExportLabel(side)}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      {lastInfo && !error && (
        <p className="mt-3 text-xs text-emerald-700">{lastInfo}</p>
      )}
    </div>
  );
}
