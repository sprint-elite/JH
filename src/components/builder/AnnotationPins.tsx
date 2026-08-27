"use client";

import { useState } from "react";
import { useBuilderStore } from "@/store";
import type { AnnotationItem } from "@/types/builder";

interface AnnotationPinsProps {
  canvasWidth: number;
  canvasHeight: number;
}

export function AnnotationPins({
  canvasWidth,
  canvasHeight,
}: AnnotationPinsProps) {
  const currentSide = useBuilderStore((s) => s.currentSide);
  const annotations = useBuilderStore((s) => s.annotations);
  const activeId = useBuilderStore((s) => s.activeAnnotationId);
  const setActiveId = useBuilderStore((s) => s.setActiveAnnotationId);

  const [hoverId, setHoverId] = useState<string | null>(null);

  if (canvasWidth < 1 || canvasHeight < 1) return null;

  const visible = annotations.filter((a) => a.side === currentSide);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[15]"
      style={{ width: canvasWidth, height: canvasHeight }}
    >
      {visible.map((pin) => (
        <PinMarker
          key={pin.id}
          pin={pin}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          active={activeId === pin.id}
          hover={hoverId === pin.id}
          onHover={setHoverId}
          onSelect={setActiveId}
        />
      ))}
    </div>
  );
}

function PinMarker({
  pin,
  canvasWidth,
  canvasHeight,
  active,
  hover,
  onHover,
  onSelect,
}: {
  pin: AnnotationItem;
  canvasWidth: number;
  canvasHeight: number;
  active: boolean;
  hover: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const left = pin.x * canvasWidth;
  const top = pin.y * canvasHeight;

  return (
    <div
      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full"
      style={{ left, top: top + 6 }}
      onMouseEnter={() => onHover(pin.id)}
      onMouseLeave={() => onHover(null)}
    >
      <button
        type="button"
        onClick={() => onSelect(pin.id)}
        className={`relative flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow transition-transform ${
          active || hover
            ? "bg-blue-600 ring-2 ring-blue-300"
            : "bg-zinc-800 hover:bg-blue-600"
        }`}
      >
        {pin.number}
        <span className="absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-inherit" />
      </button>

      {hover && (
        <div className="absolute left-1/2 top-full z-30 mt-1.5 w-52 -translate-x-1/2 rounded-lg bg-zinc-900 px-3 py-2 text-white shadow-xl">
          <p className="text-[11px] font-semibold">{pin.title}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-300">
            {pin.message}
          </p>
          <p className="mt-1.5 text-[9px] text-zinc-500">
            {formatDate(pin.createdAt)} · {pin.author}
          </p>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
