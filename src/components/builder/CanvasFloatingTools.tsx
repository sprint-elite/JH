"use client";

import { useRef } from "react";
import { ImagePlus, Shirt, Sparkles, Type } from "lucide-react";
import type { DesignCanvasRef } from "./DesignCanvas";

interface CanvasFloatingToolsProps {
  canvasRef: React.RefObject<DesignCanvasRef | null>;
  disabled?: boolean;
  onProductChange?: () => void;
  onDesignClick?: () => void;
  designActive?: boolean;
}

const TOOLS: Array<{
  key: "product" | "image" | "text" | "design";
  icon: typeof Shirt;
  label: string;
  labelLines?: [string, string];
}> = [
  { key: "product", icon: Shirt, label: "상품 변경" },
  {
    key: "image",
    icon: ImagePlus,
    label: "이미지 업로드",
    labelLines: ["이미지", "업로드"],
  },
  { key: "text", icon: Type, label: "텍스트" },
  {
    key: "design",
    icon: Sparkles,
    label: "AI 디자인",
    labelLines: ["AI", "디자인"],
  },
];

export function CanvasFloatingTools({
  canvasRef,
  disabled,
  onProductChange,
  onDesignClick,
  designActive,
}: CanvasFloatingToolsProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleClick = (key: (typeof TOOLS)[number]["key"]) => {
    if (key === "product") onProductChange?.();
    if (key === "image") fileRef.current?.click();
    if (key === "text") canvasRef.current?.addText();
    if (key === "design") onDesignClick?.();
  };

  return (
    <div className="pointer-events-none absolute right-3 top-[52%] z-20 flex -translate-y-1/2 flex-col gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void canvasRef.current?.addImageFromFile(f);
          e.target.value = "";
        }}
      />
      {TOOLS.map(({ key, icon: Icon, label, labelLines }) => {
        const isDisabled =
          disabled || (key === "product" && !onProductChange);
        return (
          <button
            key={key}
            type="button"
            disabled={isDisabled}
            onClick={() => handleClick(key)}
            className={`pointer-events-auto flex w-[72px] cursor-pointer flex-col items-center gap-1 rounded-xl px-2 py-2.5 shadow-md ring-1 transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-md ${
              key === "design" && designActive
                ? "bg-zinc-900 text-white ring-zinc-900"
                : "bg-white text-zinc-700 ring-zinc-200/80 hover:ring-zinc-300"
            }`}
          >
            <Icon
              className={`h-5 w-5 ${
                key === "design" && designActive ? "text-white" : "text-zinc-700"
              }`}
              strokeWidth={1.5}
            />
            <span
              className={`text-center text-[10px] font-medium leading-tight ${
                key === "design" && designActive ? "text-white" : "text-zinc-600"
              }`}
            >
              {labelLines ? (
                <>
                  {labelLines[0]}
                  <br />
                  {labelLines[1]}
                </>
              ) : (
                label
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
