"use client";

import { useBuilderStore } from "@/store";
import { useBuilderProduct } from "@/components/builder/BuilderProductContext";
import type { DesignCanvasRef } from "./DesignCanvas";
import type { ViewSide } from "@/types/builder";
import { getDesignViewSides, resolveSideLabel } from "@/types/builder";

interface CanvasViewToggleProps {
  canvasRef: React.RefObject<DesignCanvasRef | null>;
  shiftLeft?: boolean;
}

export function CanvasViewToggle({ canvasRef, shiftLeft }: CanvasViewToggleProps) {
  const currentSide = useBuilderStore((s) => s.currentSide);
  const productType = useBuilderStore((s) => s.options.productType);
  const printSide = useBuilderStore((s) => s.options.printSide);
  const setCurrentSide = useBuilderStore((s) => s.setCurrentSide);
  const saveCurrentDesign = useBuilderStore((s) => s.saveCurrentDesign);
  const product = useBuilderProduct();
  const faces = product?.mockupFaces ?? [];
  const customSides = faces.length > 0 ? faces.map((f) => f.side) : null;

  const viewSides = getDesignViewSides(productType, printSide, customSides);

  const switchTo = (side: ViewSide) => {
    if (side === currentSide) return;

    const canvas = canvasRef.current;
    if (canvas) {
      saveCurrentDesign(currentSide, canvas.exportJson());
    }
    setCurrentSide(side);
  };

  if (viewSides.length <= 1) return null;

  return (
    <div
      className={`pointer-events-none absolute top-4 z-20 flex items-center gap-2 ${
        shiftLeft ? "left-4 right-auto" : "right-4"
      }`}
    >
      <div className="pointer-events-auto flex max-w-[min(100vw-2rem,28rem)] flex-wrap justify-end rounded-full bg-white p-1 shadow-lg ring-1 ring-zinc-200">
        {viewSides.map((side) => {
          const active = currentSide === side;
          return (
            <button
              key={side}
              type="button"
              onClick={() => switchTo(side)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {resolveSideLabel(side, faces)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
