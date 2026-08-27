"use client";

import { useBuilderStore } from "@/store";
import { useBuilderProduct } from "@/components/builder/BuilderProductContext";
import type { ViewSide } from "@/types/builder";
import { getDesignViewSides, resolveSideLabel } from "@/types/builder";

interface ViewTabsBarProps {
  onSideChange: (side: ViewSide) => void;
}

export function ViewTabsBar({ onSideChange }: ViewTabsBarProps) {
  const currentSide = useBuilderStore((s) => s.currentSide);
  const productType = useBuilderStore((s) => s.options.productType);
  const printSide = useBuilderStore((s) => s.options.printSide);
  const product = useBuilderProduct();
  const faces = product?.mockupFaces ?? [];
  const customSides = faces.length > 0 ? faces.map((f) => f.side) : null;
  const enabled = getDesignViewSides(productType, printSide, customSides);

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-zinc-100 bg-white py-3">
      {enabled.map((side) => {
        const active = currentSide === side;
        return (
          <button
            key={side}
            type="button"
            onClick={() => onSideChange(side)}
            className={`min-w-[88px] rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
              active
                ? "bg-zinc-900 text-white shadow-md"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {resolveSideLabel(side, faces)}
          </button>
        );
      })}
    </div>
  );
}
