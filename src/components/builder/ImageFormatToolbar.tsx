"use client";

import {
  FlipHorizontal,
  FlipVertical,
  Redo2,
  RotateCw,
  Trash2,
  Undo2,
} from "lucide-react";
import type { DesignCanvasRef } from "./DesignCanvas";
import type { ImageStyleState } from "@/types/image-style";

interface ImageFormatToolbarProps {
  canvasRef: React.RefObject<DesignCanvasRef | null>;
  style: ImageStyleState;
  disabled?: boolean;
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px shrink-0 bg-zinc-200" />;
}

export function ImageFormatToolbar({
  canvasRef,
  style,
  disabled,
}: ImageFormatToolbarProps) {
  const patch = (p: Partial<ImageStyleState>) => {
    canvasRef.current?.updateImageStyle(p);
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-[10px] text-zinc-400">크기</span>
        <input
          type="range"
          disabled={disabled}
          min={10}
          max={300}
          step={1}
          value={Math.round(style.scale * 100)}
          onChange={(e) => patch({ scale: Number(e.target.value) / 100 })}
          className="h-8 w-24 accent-zinc-900 disabled:opacity-30"
          title="크기"
        />
        <span className="w-9 text-right text-[10px] font-medium text-zinc-600">
          {Math.round(style.scale * 100)}%
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-[10px] text-zinc-400">투명도</span>
        <input
          type="range"
          disabled={disabled}
          min={0}
          max={100}
          step={1}
          value={Math.round(style.opacity * 100)}
          onChange={(e) => patch({ opacity: Number(e.target.value) / 100 })}
          className="h-8 w-20 accent-zinc-900 disabled:opacity-30"
          title="투명도"
        />
        <span className="w-8 text-right text-[10px] font-medium text-zinc-600">
          {Math.round(style.opacity * 100)}%
        </span>
      </div>

      <button
        type="button"
        disabled={disabled}
        title="90° 회전"
        onClick={() => patch({ angle: (style.angle + 90) % 360 })}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30"
      >
        <RotateCw className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        disabled={disabled}
        title="좌우 반전"
        onClick={() => canvasRef.current?.flipHorizontal()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30"
      >
        <FlipHorizontal className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        disabled={disabled}
        title="상하 반전"
        onClick={() => canvasRef.current?.flipVertical()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30"
      >
        <FlipVertical className="h-4 w-4" strokeWidth={1.5} />
      </button>

      <ToolbarDivider />

      <button
        type="button"
        disabled={disabled}
        title="실행 취소"
        onClick={() => canvasRef.current?.undo()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30"
      >
        <Undo2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        disabled={disabled}
        title="다시 실행"
        onClick={() => canvasRef.current?.redo()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30"
      >
        <Redo2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        disabled={disabled}
        title="삭제"
        onClick={() => canvasRef.current?.deleteSelected()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </>
  );
}
