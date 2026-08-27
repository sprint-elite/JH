"use client";

import { useMemo } from "react";
import { useBuilderStore } from "@/store";
import type {
  FabricOption,
  HandleOption,
  PocketOption,
  PrintSideOption,
} from "@/types/builder";
import {
  FABRIC_LABELS,
  HANDLE_LABELS,
  POCKET_LABELS,
  PRINT_SIDE_LABELS,
} from "@/types/builder";
import { useBuilderProduct } from "./BuilderProductContext";

const FIELDS: {
  key: "fabric" | "handle" | "pocket" | "printSide";
  label: string;
  options: [string, string][];
  schemaKey: "fabrics" | "handles" | "pockets" | "printSides";
}[] = [
  {
    key: "fabric",
    label: "원단",
    options: Object.entries(FABRIC_LABELS),
    schemaKey: "fabrics",
  },
  {
    key: "handle",
    label: "손잡이",
    options: Object.entries(HANDLE_LABELS),
    schemaKey: "handles",
  },
  {
    key: "pocket",
    label: "포켓",
    options: Object.entries(POCKET_LABELS),
    schemaKey: "pockets",
  },
  {
    key: "printSide",
    label: "인쇄면",
    options: Object.entries(PRINT_SIDE_LABELS),
    schemaKey: "printSides",
  },
];

export function ProductOptionPanel() {
  const product = useBuilderProduct();
  const options = useBuilderStore((s) => s.options);
  const setOption = useBuilderStore((s) => s.setOption);

  const visibleFields = useMemo(() => {
    return FIELDS.map((field) => {
      const allowed = product?.optionSchema?.[field.schemaKey] as
        | string[]
        | undefined;
      const opts = allowed?.length
        ? field.options.filter(([val]) => allowed.includes(val))
        : field.options;
      return { ...field, opts };
    }).filter((field) => field.opts.length > 0);
  }, [product]);

  return (
    <div className="space-y-4">
      {visibleFields.map(({ key, label, opts }) => (
        <div key={key}>
          <p className="mb-2 text-sm font-semibold text-zinc-800">{label}</p>
          <div className="flex flex-wrap gap-2">
            {opts.map(([val, text]) => {
              const active = options[key] === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() =>
                    setOption(
                      key,
                      val as
                        | FabricOption
                        | HandleOption
                        | PocketOption
                        | PrintSideOption,
                    )
                  }
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {text}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
