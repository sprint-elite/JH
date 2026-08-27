"use client";

import { BAG_COLOR_PRESETS } from "@/lib/fabric/bag-colors";
import { useBuilderStore } from "@/store";
import type {
  BagColorOption,
  BagShapeOption,
  ClosureOption,
} from "@/types/builder";
import {
  BAG_COLOR_LABELS,
  BAG_SHAPE_LABELS,
  CLOSURE_LABELS,
} from "@/types/builder";
import { useBuilderProduct } from "./BuilderProductContext";

export function ProductExtrasOptions() {
  const product = useBuilderProduct();
  const schema = product?.optionSchema;
  const options = useBuilderStore((s) => s.options);
  const setOption = useBuilderStore((s) => s.setOption);

  if (!schema) return null;

  const strapColors = schema.handleStrapColors;
  const closureTypes = schema.closureTypes;
  const bagShapes = schema.bagShapes;

  if (!strapColors?.length && !closureTypes?.length && !bagShapes?.length) {
    return null;
  }

  const strapPresets = strapColors?.length
    ? BAG_COLOR_PRESETS.filter((p) =>
        strapColors.includes(p.id as BagColorOption),
      )
    : [];

  return (
    <div className="space-y-5">
      {strapPresets.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">
            손잡이 끈 색상 - {BAG_COLOR_LABELS[options.handleStrapColor]}
          </p>
          <div className="flex flex-wrap gap-2">
            {strapPresets.map((preset) => {
              const active = options.handleStrapColor === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.label}
                  onClick={() =>
                    setOption("handleStrapColor", preset.id as BagColorOption)
                  }
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
      )}

      {closureTypes && closureTypes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">단추</p>
          <div className="flex flex-wrap gap-2">
            {closureTypes.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setOption("closureType", value as ClosureOption)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  options.closureType === value
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {CLOSURE_LABELS[value]}
              </button>
            ))}
          </div>
        </div>
      )}

      {bagShapes && bagShapes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">에코백 형태</p>
          <select
            value={options.bagShape}
            onChange={(e) =>
              setOption("bagShape", e.target.value as BagShapeOption)
            }
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-100"
          >
            {bagShapes.map((value) => (
              <option key={value} value={value}>
                {BAG_SHAPE_LABELS[value]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-zinc-400">
            선택: {BAG_SHAPE_LABELS[options.bagShape]}
          </p>
        </div>
      )}
    </div>
  );
}
