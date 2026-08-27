"use client";

import {
  ArrowDown,
  ArrowUp,
  FlipHorizontal,
  FlipVertical,
  Layers,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { DesignCanvasRef } from "./DesignCanvas";
import { TextFormatToolbar } from "./TextFormatToolbar";
import { ImageFormatToolbar } from "./ImageFormatToolbar";
import type { CanvasSelectionState } from "@/types/text-style";

interface BuilderTopToolbarProps {
  canvasRef: React.RefObject<DesignCanvasRef | null>;
  disabled?: boolean;
  onClear?: () => void;
  onOpenLayers?: () => void;
  layersOpen?: boolean;
  canvasZoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  selectionState?: CanvasSelectionState;
  trailing?: React.ReactNode;
  showPrintAreaGuide?: boolean;
  onShowPrintAreaGuideChange?: (value: boolean) => void;
}

function ZoomControls({
  canvasZoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: Pick<
  BuilderTopToolbarProps,
  "canvasZoom" | "onZoomIn" | "onZoomOut" | "onZoomReset"
>) {
  const zoomPercent = Math.round((canvasZoom ?? 1) * 100);

  return (
    <>
      <div className="mx-1 h-6 w-px shrink-0 bg-zinc-200" />
      <button
        type="button"
        title="축소"
        onClick={onZoomOut}
        className="flex shrink-0 flex-col items-center gap-0.5 rounded px-2 py-1 text-[10px] text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800"
      >
        <ZoomOut className="h-4 w-4" strokeWidth={1.5} />
        <span className="whitespace-nowrap">축소</span>
      </button>
      <button
        type="button"
        title="100%로 초기화"
        onClick={onZoomReset}
        className="flex shrink-0 flex-col items-center gap-0.5 rounded px-2 py-1 text-[10px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        <span className="text-[11px] leading-4">{zoomPercent}%</span>
        <span className="whitespace-nowrap text-[10px] font-normal text-zinc-400">배율</span>
      </button>
      <button
        type="button"
        title="확대"
        onClick={onZoomIn}
        className="flex shrink-0 flex-col items-center gap-0.5 rounded px-2 py-1 text-[10px] text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800"
      >
        <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
        <span className="whitespace-nowrap">확대</span>
      </button>
    </>
  );
}

function PrintAreaGuideToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex shrink-0 cursor-pointer select-none items-center gap-1.5 rounded px-2 py-1 text-[10px] text-zinc-600 transition-colors hover:bg-zinc-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-zinc-300 text-sky-500 focus:ring-sky-400"
      />
      <span className="whitespace-nowrap font-medium">인쇄영역 표시</span>
    </label>
  );
}

function ToolbarTrailing({
  showPrintAreaGuide,
  onShowPrintAreaGuideChange,
  trailing,
}: Pick<
  BuilderTopToolbarProps,
  "showPrintAreaGuide" | "onShowPrintAreaGuideChange" | "trailing"
>) {
  if (!onShowPrintAreaGuideChange && !trailing) return null;

  return (
    <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
      {onShowPrintAreaGuideChange && (
        <PrintAreaGuideToggle
          checked={showPrintAreaGuide ?? true}
          onChange={onShowPrintAreaGuideChange}
        />
      )}
      {trailing}
    </div>
  );
}

export function BuilderTopToolbar({
  canvasRef,
  disabled,
  onClear,
  onOpenLayers,
  layersOpen,
  canvasZoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  selectionState = { kind: "none" },
  trailing,
  showPrintAreaGuide = true,
  onShowPrintAreaGuideChange,
}: BuilderTopToolbarProps) {
  const isTextMode = selectionState.kind === "text" && !disabled;
  const isImageMode = selectionState.kind === "image" && !disabled;

  if (isTextMode) {
    return (
      <div className="flex h-11 shrink-0 items-center gap-2 overflow-x-auto border-b border-zinc-200 bg-white px-3">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          텍스트
        </span>
        <TextFormatToolbar
          canvasRef={canvasRef}
          style={selectionState.style}
          disabled={disabled}
        />
        <ZoomControls
          canvasZoom={canvasZoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
        />
        <ToolbarTrailing
          showPrintAreaGuide={showPrintAreaGuide}
          onShowPrintAreaGuideChange={onShowPrintAreaGuideChange}
          trailing={trailing}
        />
      </div>
    );
  }

  if (isImageMode) {
    return (
      <div className="flex h-11 shrink-0 items-center gap-2 overflow-x-auto border-b border-zinc-200 bg-white px-3">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          이미지
        </span>
        <ImageFormatToolbar
          canvasRef={canvasRef}
          style={selectionState.style}
          disabled={disabled}
        />
        <ZoomControls
          canvasZoom={canvasZoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
        />
        <ToolbarTrailing
          showPrintAreaGuide={showPrintAreaGuide}
          onShowPrintAreaGuideChange={onShowPrintAreaGuideChange}
          trailing={trailing}
        />
      </div>
    );
  }

  const items = [
    { icon: RotateCcw, label: "처음으로", onClick: onClear },
    { icon: Undo2, label: "실행 취소", onClick: () => canvasRef.current?.undo() },
    { icon: Redo2, label: "다시 실행", onClick: () => canvasRef.current?.redo() },
    { icon: Trash2, label: "삭제", onClick: () => canvasRef.current?.deleteSelected() },
    { icon: ArrowUp, label: "맨 앞으로", onClick: () => canvasRef.current?.bringForward() },
    { icon: ArrowDown, label: "맨 뒤로", onClick: () => canvasRef.current?.sendBackward() },
    { icon: FlipHorizontal, label: "좌우 반전", onClick: () => canvasRef.current?.flipHorizontal() },
    { icon: FlipVertical, label: "상하 반전", onClick: () => canvasRef.current?.flipVertical() },
    { icon: Layers, label: "레이어", onClick: onOpenLayers, active: layersOpen },
  ];

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-zinc-200 bg-white px-3">
      {items.map(({ icon: Icon, label, onClick, active }) => (
        <button
          key={label}
          type="button"
          disabled={disabled && label !== "레이어"}
          title={label}
          onClick={onClick}
          className={`flex shrink-0 flex-col items-center gap-0.5 rounded px-2 py-1 text-[10px] transition-colors disabled:opacity-30 ${
            active
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.5} />
          <span className="whitespace-nowrap">{label}</span>
        </button>
      ))}
      <ZoomControls
        canvasZoom={canvasZoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomReset={onZoomReset}
      />
      <ToolbarTrailing
        showPrintAreaGuide={showPrintAreaGuide}
        onShowPrintAreaGuideChange={onShowPrintAreaGuideChange}
        trailing={trailing}
      />
    </div>
  );
}
