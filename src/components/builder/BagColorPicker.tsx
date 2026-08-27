"use client";

import { BAG_COLOR_PRESETS } from "@/lib/fabric/bag-colors";
import { useBuilderStore } from "@/store";
import type { BagColorOption } from "@/types/builder";
import { BAG_COLOR_LABELS } from "@/types/builder";
import { useBuilderProduct } from "./BuilderProductContext";

export function BagColorPicker() {
  const product = useBuilderProduct();
  const bagColor = useBuilderStore((s) => s.options.bagColor);
  const setOption = useBuilderStore((s) => s.setOption);

  const presets = product?.optionSchema?.colors?.length
    ? BAG_COLOR_PRESETS.filter((p) =>
        product.optionSchema!.colors!.includes(p.id as BagColorOption),
      )
    : BAG_COLOR_PRESETS;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-zinc-800">
        본체 색상 - {BAG_COLOR_LABELS[bagColor]}
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {          const active = bagColor === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              onClick={() => setOption("bagColor", preset.id as BagColorOption)}
              className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 ${
                active
                  ? "border-zinc-900 ring-2 ring-zinc-300 ring-offset-1"
                  : "border-zinc-200"
              }`}
              style={{ backgroundColor: preset.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}
