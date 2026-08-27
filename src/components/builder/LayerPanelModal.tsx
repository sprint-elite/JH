"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  GripHorizontal,
  ImageIcon,
  Layers,
  Trash2,
  Type,
  X,
} from "lucide-react";
import type { DesignCanvasRef } from "./DesignCanvas";
import type { LayerInfo } from "@/lib/fabric/bag-canvas";

interface LayerPanelModalProps {
  open: boolean;
  canvasRef: React.RefObject<DesignCanvasRef | null>;
  designRevision: number;
  onClose: () => void;
}

const DEFAULT_POS = { x: 16, y: 88 };
const PANEL_W = 256;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
};

export function LayerPanelModal({
  open,
  canvasRef,
  designRevision,
  onClose,
}: LayerPanelModalProps) {
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [pos, setPos] = useState(DEFAULT_POS);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const refresh = useCallback(() => {
    setLayers(canvasRef.current?.getLayers() ?? []);
  }, [canvasRef]);

  useEffect(() => {
    if (open) refresh();
  }, [open, designRevision, refresh]);

  const clampPosition = useCallback((x: number, y: number) => {
    const panel = panelRef.current;
    const maxX = window.innerWidth - (panel?.offsetWidth ?? PANEL_W);
    const maxY = window.innerHeight - (panel?.offsetHeight ?? 200);
    return {
      x: Math.min(Math.max(0, x), Math.max(0, maxX)),
      y: Math.min(Math.max(0, y), Math.max(0, maxY)),
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;

      const next = clampPosition(
        drag.origX + (e.clientX - drag.startX),
        drag.origY + (e.clientY - drag.startY),
      );
      setPos(next);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (dragRef.current?.pointerId === e.pointerId) {
        dragRef.current = null;
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [open, clampPosition]);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (!open) return null;

  const act = (fn: () => void) => {
    fn();
    refresh();
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-40 w-64 rounded-xl border border-zinc-200 bg-white shadow-xl"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        role="toolbar"
        aria-label="레이어 패널 이동"
        onPointerDown={startDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex cursor-grab items-center justify-between border-b border-zinc-100 px-3 py-2.5 active:cursor-grabbing"
      >
        <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-zinc-800">
          <GripHorizontal className="h-4 w-4 shrink-0 text-zinc-400" />
          <Layers className="h-4 w-4 shrink-0" />
          <span>레이어</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto p-2">
        {layers.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-zinc-400">
            레이어가 없습니다
          </p>
        ) : (
          <ul className="space-y-1">
            {layers.map((layer) => (
              <li
                key={layer.id}
                className="flex items-center gap-1 rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-1.5"
              >
                <button
                  type="button"
                  onClick={() =>
                    act(() => canvasRef.current?.selectLayer(layer.stackIndex))
                  }
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs text-zinc-700 hover:text-zinc-900"
                >
                  {layer.type === "text" ? (
                    <Type className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  ) : layer.type === "image" ? (
                    <ImageIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  ) : (
                    <Layers className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  )}
                  <span className="truncate">{layer.label}</span>
                </button>
                <button
                  type="button"
                  title="앞으로"
                  onClick={() =>
                    act(() => canvasRef.current?.moveLayerUp(layer.stackIndex))
                  }
                  className="rounded p-0.5 text-zinc-400 hover:bg-white hover:text-zinc-700"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="뒤로"
                  onClick={() =>
                    act(() =>
                      canvasRef.current?.moveLayerDown(layer.stackIndex),
                    )
                  }
                  className="rounded p-0.5 text-zinc-400 hover:bg-white hover:text-zinc-700"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="삭제"
                  onClick={() =>
                    act(() => canvasRef.current?.deleteLayer(layer.stackIndex))
                  }
                  className="rounded p-0.5 text-zinc-400 hover:bg-white hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
